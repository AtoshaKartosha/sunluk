import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  createTranslationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  deleteShippingOptionsWorkflow,
  CreateShippingOptionsWorkflowInput,
} from "@medusajs/medusa/core-flows";
import { REGIONAL_FULFILLMENT_PROVIDER_ID } from "../modules/regional-fulfillment/service";
import { normalizeStore } from "./normalize-store";
export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  );

  const countries = ["gb", "de", "dk", "se", "fr", "es", "it", "ru"];

  logger.info("Seeding store data...");
  const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
  const existingSalesChannels = (await salesChannelService.listSalesChannels(
    {
      name: "Default Sales Channel",
    },
    {
      order: { created_at: "ASC" },
    }
  )).filter((sc) => !sc.is_disabled);

  let defaultSalesChannel = existingSalesChannels[0];
  if (!defaultSalesChannel) {
    const {
      result: [newChannel],
    } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
            description: "Created by Medusa",
          },
        ],
      },
    });
    defaultSalesChannel = newChannel;
  }

  const apiKeyService = container.resolve(Modules.API_KEY);
  const existingApiKeys = (await apiKeyService.listApiKeys(
    {
      title: "Default Publishable API Key",
      type: "publishable",
    },
    {
      order: { created_at: "ASC" },
    }
  )).filter((k) => k.revoked_at === null);

  let publishableApiKey = existingApiKeys[0];
  if (!publishableApiKey) {
    const {
      result: [newKey],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Default Publishable API Key",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });
    publishableApiKey = newKey;
  }

  const existingLinks = await link.list({
    [Modules.API_KEY]: { publishable_key_id: publishableApiKey.id },
    [Modules.SALES_CHANNEL]: { sales_channel_id: defaultSalesChannel.id },
  });

  if (existingLinks.length === 0) {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: [defaultSalesChannel.id],
      },
    });
  }
  const store = await normalizeStore(container, defaultSalesChannel.id);

  logger.info("Seeding locales...");
  const translationModuleService = container.resolve(Modules.TRANSLATION);

  try {
    const existing = await translationModuleService.listLocales({
      code: ["ru-RU", "en-US"],
    });
    const existingCodes = new Set(existing.map((l) => l.code));
    const toCreate: { code: string; name: string }[] = [];
    if (!existingCodes.has("ru-RU")) {
      toCreate.push({ code: "ru-RU", name: "Russian (Russia)" });
    }
    if (!existingCodes.has("en-US")) {
      toCreate.push({ code: "en-US", name: "English (United States)" });
    }
    if (toCreate.length > 0) {
      await translationModuleService.createLocales(toCreate);
    }
  } catch (err) {
    logger.warn("Failed to create locales during seed: " + (err instanceof Error ? err.message : String(err)));
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_locales: [
          { locale_code: "ru-RU" },
          { locale_code: "en-US" },
        ],
      },
    },
  });
  logger.info("Finished seeding locales.");

  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "Europe",
          currency_code: "eur",
          countries: ["de", "dk", "se", "fr", "es", "it", "gb"],
          payment_providers: ["pp_system_default"],
        },
        {
          name: "Russia",
          currency_code: "rub",
          countries: ["ru"],
          payment_providers: ["pp_system_default"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "European Warehouse",
          address: {
            city: "Copenhagen",
            country_code: "DK",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  const europeRegion = regionResult.find((r) => r.name === "Europe");
  const russiaRegion = regionResult.find((r) => r.name === "Russia");
  if (!europeRegion || !russiaRegion) {
    throw new Error("Europe or Russia region is missing.");
  }

  // Idempotent manual provider link creation
  const existingManualLinks = await link.list({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });
  if (existingManualLinks.length === 0) {
    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: "manual_manual",
      },
    });
  }

  // Dismiss old provider link if it exists
  const oldProviderLinks = await link.list({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "regional-fulfillment",
    },
  });
  if (oldProviderLinks.length > 0) {
    await link.dismiss({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: "regional-fulfillment",
      },
    });
  }

  // Idempotent regional provider link creation
  const existingProviderLinks = await link.list({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: REGIONAL_FULFILLMENT_PROVIDER_ID,
    },
  });
  if (existingProviderLinks.length === 0) {
    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: REGIONAL_FULFILLMENT_PROVIDER_ID,
      },
    });
  }

  logger.info("Seeding fulfillment data...");
  // This is created by a migration script in core.
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  // Find or create fulfillment set
  const { data: fulfillmentSetsList } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "service_zones.*", "service_zones.geo_zones.*"],
  });

  interface GeoZoneShape {
    id: string;
    country_code: string;
    type: string;
  }
  interface ServiceZoneShape {
    id: string;
    name: string;
    geo_zones: GeoZoneShape[];
  }
  interface FulfillmentSetShape {
    id: string;
    name: string;
    service_zones: ServiceZoneShape[];
  }
  let fulfillmentSet: FulfillmentSetShape | undefined;
  
  if (fulfillmentSetsList && Array.isArray(fulfillmentSetsList)) {
    const typedFS = fulfillmentSetsList as unknown as FulfillmentSetShape[];
    fulfillmentSet = typedFS.find((fs) => fs.name === "European Warehouse delivery");
  }

  if (!fulfillmentSet) {
    const createdFS = await fulfillmentModuleService.createFulfillmentSets({
      name: "European Warehouse delivery",
      type: "shipping",
      service_zones: [
        {
          name: "Europe",
          geo_zones: [
            { country_code: "gb", type: "country" },
            { country_code: "de", type: "country" },
            { country_code: "dk", type: "country" },
            { country_code: "se", type: "country" },
            { country_code: "fr", type: "country" },
            { country_code: "es", type: "country" },
            { country_code: "it", type: "country" },
          ],
        },
        {
          name: "Russia",
          geo_zones: [
            { country_code: "ru", type: "country" },
          ],
        },
      ],
    });
    fulfillmentSet = createdFS as unknown as FulfillmentSetShape;
  }

  let europeServiceZone = fulfillmentSet.service_zones?.find((sz) => sz.name === "Europe");
  let russiaServiceZone = fulfillmentSet.service_zones?.find((sz) => sz.name === "Russia");

  if (!europeServiceZone) {
    const createdSZ = await fulfillmentModuleService.createServiceZones({
      fulfillment_set_id: fulfillmentSet.id,
      name: "Europe",
      geo_zones: [
        { country_code: "gb", type: "country" },
        { country_code: "de", type: "country" },
        { country_code: "dk", type: "country" },
        { country_code: "se", type: "country" },
        { country_code: "fr", type: "country" },
        { country_code: "es", type: "country" },
        { country_code: "it", type: "country" },
      ],
    });
    europeServiceZone = (Array.isArray(createdSZ) ? createdSZ[0] : createdSZ) as unknown as ServiceZoneShape;
  }

  if (!russiaServiceZone) {
    const createdSZ = await fulfillmentModuleService.createServiceZones({
      fulfillment_set_id: fulfillmentSet.id,
      name: "Russia",
      geo_zones: [
        { country_code: "ru", type: "country" },
      ],
    });
    russiaServiceZone = (Array.isArray(createdSZ) ? createdSZ[0] : createdSZ) as unknown as ServiceZoneShape;
  }

  // Idempotent link creation for stock location to fulfillment set
  const existingSetLinks = await link.list({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });
  if (existingSetLinks.length === 0) {
    await link.create({
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stockLocation.id,
      },
      [Modules.FULFILLMENT]: {
        fulfillment_set_id: fulfillmentSet.id,
      },
    });
  }

  const { data: existingOptions } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "service_zone_id", "provider_id"],
  });

  interface ShippingOptionShape {
    id: string;
    name: string;
    service_zone_id: string;
    provider_id: string;
  }
  let typedExistingOptions = existingOptions as unknown as ShippingOptionShape[];

  // Delete outdated options with old provider_id "regional-fulfillment"
  const oldCalculatedOptions = typedExistingOptions.filter(
    (so) => so.provider_id === "regional-fulfillment"
  );
  if (oldCalculatedOptions.length > 0) {
    const oldOptionIds = oldCalculatedOptions.map((o) => o.id);
    await deleteShippingOptionsWorkflow(container).run({
      input: { ids: oldOptionIds }
    });
    typedExistingOptions = typedExistingOptions.filter(
      (so) => !oldOptionIds.includes(so.id)
    );
  }

  // Seed manual shipping options if not present
  const hasEuropeManualStandard = typedExistingOptions.some(
    (so) => so.provider_id === "manual_manual" && so.service_zone_id === europeServiceZone.id && so.name === "Standard Shipping"
  );
  const hasEuropeManualExpress = typedExistingOptions.some(
    (so) => so.provider_id === "manual_manual" && so.service_zone_id === europeServiceZone.id && so.name === "Express Shipping"
  );
  const russiaDeliveryOptions = [
    { name: "Почта России", code: "russian-post" },
    { name: "СДЭК", code: "cdek" },
    { name: "Курьером по Москве", code: "moscow-courier" },
  ] as const;
  const obsoleteRussiaOptions = typedExistingOptions.filter(
    (shippingOption) =>
      shippingOption.service_zone_id === russiaServiceZone.id &&
      (shippingOption.provider_id === "manual_manual" ||
        (shippingOption.provider_id === REGIONAL_FULFILLMENT_PROVIDER_ID &&
          !russiaDeliveryOptions.some(({ name }) => name === shippingOption.name)))
  );
  if (obsoleteRussiaOptions.length > 0) {
    const obsoleteIds = obsoleteRussiaOptions.map((option) => option.id);
    await deleteShippingOptionsWorkflow(container).run({
      input: { ids: obsoleteIds },
    });
    typedExistingOptions = typedExistingOptions.filter(
      (option) => !obsoleteIds.includes(option.id)
    );
  }

  const manualOptionsToCreate: CreateShippingOptionsWorkflowInput = [];
  if (!hasEuropeManualStandard) {
    manualOptionsToCreate.push({
      name: "Standard Shipping",
      price_type: "flat",
      provider_id: "manual_manual",
      service_zone_id: europeServiceZone.id,
      shipping_profile_id: shippingProfile.id,
      type: {
        label: "Standard",
        description: "Ship in 2-3 days.",
        code: "standard",
      },
      prices: [
        { currency_code: "usd", amount: 10 },
        { currency_code: "eur", amount: 10 },
        { region_id: europeRegion.id, amount: 10 },
      ],
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    });
  }

  if (!hasEuropeManualExpress) {
    manualOptionsToCreate.push({
      name: "Express Shipping",
      price_type: "flat",
      provider_id: "manual_manual",
      service_zone_id: europeServiceZone.id,
      shipping_profile_id: shippingProfile.id,
      type: {
        label: "Express",
        description: "Ship in 24 hours.",
        code: "express",
      },
      prices: [
        { currency_code: "usd", amount: 10 },
        { currency_code: "eur", amount: 10 },
        { region_id: europeRegion.id, amount: 10 },
      ],
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    });
  }

  for (const option of russiaDeliveryOptions) {
    const exists = typedExistingOptions.some(
      (shippingOption) =>
        shippingOption.provider_id === REGIONAL_FULFILLMENT_PROVIDER_ID &&
        shippingOption.service_zone_id === russiaServiceZone.id &&
        shippingOption.name === option.name
    );
    if (!exists) {
      manualOptionsToCreate.push({
        name: option.name,
        price_type: "calculated",
        provider_id: REGIONAL_FULFILLMENT_PROVIDER_ID,
        service_zone_id: russiaServiceZone.id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: option.name,
          description: "Бесплатная доставка",
          code: option.code,
        },
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      });
    }
  }

  if (manualOptionsToCreate.length > 0) {
    await createShippingOptionsWorkflow(container).run({
      input: manualOptionsToCreate,
    });
  }


  const hasEuropeCalculated = typedExistingOptions.some(
    (shippingOption) =>
      shippingOption.provider_id === REGIONAL_FULFILLMENT_PROVIDER_ID &&
      shippingOption.service_zone_id === europeServiceZone.id
  );
  if (!hasEuropeCalculated) {
    await createShippingOptionsWorkflow(container).run({
      input: [{
        name: "Standard Shipping (Calculated)",
        price_type: "calculated",
        provider_id: REGIONAL_FULFILLMENT_PROVIDER_ID,
        service_zone_id: europeServiceZone.id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Calculated delivery based on total",
          code: "standard-calculated-europe",
        },
        rules: [
          { attribute: "enabled_in_store", value: "true", operator: "eq" },
          { attribute: "is_return", value: "false", operator: "eq" },
        ],
      }],
    });
  }
  logger.info("Finished seeding fulfillment data.");
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel.id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        {
          name: "Accessories",
          is_active: true,
        },
        {
          name: "Packaging",
          handle: "packaging",
          is_active: true,
        },
      ],
    },
  });

  const accessoriesCategory = categoryResult[0];
  const packagingCategory = categoryResult[1];
  const azureMetadata = {
    wear_it_your_way: {
      ru: [
        { icon: "👓", title: "Как цепочку для очков", text: "Силиконовые держатели надежно фиксируются на большинстве оправ." },
        { icon: "✨", title: "Как колье", text: "Снимите силиконовые держатели — аксессуар превращается в элегантное украшение." },
        { icon: "🕶", title: "Как держатель для очков", text: "Закрепите очки на фирменном кольце, не снимая колье. Удобно, безопасно и всегда под рукой." }
      ],
      en: [
        { icon: "👓", title: "As an Eyewear Chain", text: "Silicone loops securely fit most eyeglass frames." },
        { icon: "✨", title: "As a Necklace", text: "Remove the silicone loops to transform it into an elegant everyday necklace." },
        { icon: "🕶", title: "As an Eyewear Holder", text: "Attach your glasses to the signature ring without taking off the necklace. Secure, stylish, and always within reach." }
      ]
    },
    whats_included: {
      ru: ["Украшение SUNLUK (Длина – 72 см)", "Фирменное кольцо", "Прозрачные силиконовые держатели"],
      en: ["SUNLUK Accessory (Length: 72 cm)", "Signature Ring", "Clear Silicone Loops"]
    }
  };

  const duneMetadata = {
    wear_it_your_way: {
      ru: [
        { icon: "👓", title: "Как держатель для очков", text: "Закрепите очки на фирменном кольце. Они всегда будут под рукой и не займут место в сумке или кармане." },
        { icon: "✨", title: "Как колье", text: "Лаконичный дизайн делает аксессуар элегантным украшением на каждый день." },
        { icon: "🕶", title: "С очками на кольце", text: "Повесьте очки на фирменном кольце, не снимая колье. Удобно, безопасно и всегда под рукой." }
      ],
      en: [
        { icon: "👓", title: "As an Eyewear Holder", text: "Attach your glasses to the signature ring to keep them secure and always within easy reach." },
        { icon: "✨", title: "As a Necklace", text: "Its clean, minimalist design makes it an elegant everyday accessory." },
        { icon: "🕶", title: "With Glasses on the Ring", text: "Hang your glasses on the signature ring without taking off the necklace. Secure, stylish, and always within reach." }
      ]
    },
    whats_included: {
      ru: ["Украшение SUNLUK (Длина – 72 см)", "Фирменное кольцо"],
      en: ["SUNLUK Accessory (Length: 72 cm)", "Signature Ring"]
    }
  };

  const backendUrl = (process.env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/+$/, "");
  const getStaticUrl = (filename: string) => `${backendUrl}/static/${encodeURIComponent(filename)}`;

  const mediaMap: Record<string, { thumbnail?: string; images: string[] }> = {
    azure: {
      thumbnail: "1783929099277-Turquoise.webp",
      images: ["1783929099277-Turquoise.webp", "1783932921562-Turquoise 2.webp", "1783932921563-Turquoise 3.webp"],
    },
    dune: {
      thumbnail: "1783929260183-Leather Loop.webp",
      images: ["1783929260183-Leather Loop.webp", "1783932869580-Leather Loop 2.webp", "1783932869580-Leather Loop 3.webp"],
    },
    luna: {
      thumbnail: "1783929297839-Silver Chain.webp",
      images: ["1783929297839-Silver Chain.webp", "1783932890776-Silver Chain 2.webp", "1783932890777-Silver Chain 3.webp"],
    },
    silk: {
      thumbnail: "1783929220517-Sand Chain.webp",
      images: ["1783929220517-Sand Chain.webp", "1783932907893-Sand Chain 2.webp", "1783932907893-Sand Chain 3.webp"],
    },
    amethyst: {
      thumbnail: "1783928971665-Purple.webp",
      images: ["1783928971665-Purple.webp", "1783932944380-Purple 2.webp", "1783932944380-Purple 3.webp"],
    },
    lagoon: {
      thumbnail: "1783933291725-Sun Chain.webp",
      images: ["1783933291729-Sun Chain 2.webp", "1783933291730-Sun Chain 3.webp", "1783933291730-Sun Chain 4.webp"],
    },
    "velvet-pouch": {
      thumbnail: "1784536571321-Brand pouch.webp",
      images: ["1784536571321-Brand pouch.webp"],
    },
    "cotton-pouch-turquoise": {
      thumbnail: "1784536554689-Brand pouch (Turquoise).webp",
      images: ["1784536554689-Brand pouch (Turquoise).webp"],
    },
    "cotton-pouch-brown": {
      thumbnail: "1784536542288-Brand pouch (Brown).webp",
      images: ["1784536542288-Brand pouch (Brown).webp"],
    },
    "gift-box": {
      images: ["1782832052287-gift-box.png"],
    },
    "silk-pouch": {
      thumbnail: "1782832083854-silk-pouch.png",
      images: ["1782832083854-silk-pouch.png"],
    },
    "wooden-case": {
      thumbnail: "wooden-case-placeholder.webp",
      images: ["wooden-case-placeholder.webp"],
    },
  };

  const rawProducts = [
        {
          title: "Лазурь",
          subtitle: "Цепочка для очков • Колье • Держатель для очков",
          category_ids: [accessoriesCategory.id],
          description: "Фирменная цепочка SUNLUK с лазурными акцентами, вдохновленными цветом моря. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
          handle: "azure",
          weight: 120,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Material",
              values: ["Azure"],
            },
          ],
          variants: [
            {
              title: "Azure",
              sku: "AZURE-CHAIN",
              options: {
                Material: "Azure",
              },
              prices: [
                {
                  amount: 59,
                  currency_code: "eur",
                },
                {
                  amount: 65,
                  currency_code: "usd",
                },
                {
                  amount: 4999,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
          metadata: azureMetadata,
        },
        {
          title: "Дюна",
          subtitle: "Держатель для очков • Колье • Подвес для очков",
          category_ids: [accessoriesCategory.id],
          description: "Минималистичное украшение SUNLUK с фирменным кольцом в теплых природных оттенках. Носите его как стильное колье или закрепляйте очки на кольце, чтобы они всегда были под рукой.",
          handle: "dune",
          weight: 120,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Material",
              values: ["Dune"],
            },
          ],
          variants: [
            {
              title: "Dune",
              sku: "DUNE-CHAIN",
              options: {
                Material: "Dune",
              },
              prices: [
                {
                  amount: 59,
                  currency_code: "eur",
                },
                {
                  amount: 65,
                  currency_code: "usd",
                },
                {
                  amount: 4999,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
          metadata: duneMetadata,
        },
        {
          title: "Луна",
          subtitle: "Цепочка для очков • Колье • Держатель для очков",
          category_ids: [accessoriesCategory.id],
          description: "Лаконичная серебристая цепочка SUNLUK в минималистичном дизайне. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
          handle: "luna",
          weight: 120,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Material",
              values: ["Luna"],
            },
          ],
          variants: [
            {
              title: "Luna",
              sku: "LUNA-CHAIN",
              options: {
                Material: "Luna",
              },
              prices: [
                {
                  amount: 45,
                  currency_code: "eur",
                },
                {
                  amount: 50,
                  currency_code: "usd",
                },
                {
                  amount: 3999,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
          metadata: azureMetadata,
        },
        {
          title: "Шелк",
          subtitle: "Цепочка для очков • Колье • Держатель для очков",
          category_ids: [accessoriesCategory.id],
          description: "Элегантная цепочка SUNLUK с мягким плоским плетением и золотистым сиянием. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
          handle: "silk",
          weight: 120,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Material",
              values: ["Silk"],
            },
          ],
          variants: [
            {
              title: "Silk",
              sku: "SILK-CHAIN",
              options: {
                Material: "Silk",
              },
              prices: [
                {
                  amount: 54,
                  currency_code: "eur",
                },
                {
                  amount: 59,
                  currency_code: "usd",
                },
                {
                  amount: 4499,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
          metadata: azureMetadata,
        },
        {
          title: "Аметист",
          subtitle: "Цепочка для очков • Колье • Держатель для очков",
          category_ids: [accessoriesCategory.id],
          description: "Эффектная цепочка SUNLUK с бусинами глубокого аметистового оттенка. Добавляет яркий акцент образу, легко превращается в стильное колье и позволяет удобно закрепить очки с помощью силиконовых держателей.",
          handle: "amethyst",
          weight: 120,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Material",
              values: ["Amethyst"],
            },
          ],
          variants: [
            {
              title: "Amethyst",
              sku: "AMETHYST-CHAIN",
              options: {
                Material: "Amethyst",
              },
              prices: [
                {
                  amount: 54,
                  currency_code: "eur",
                },
                {
                  amount: 59,
                  currency_code: "usd",
                },
                {
                  amount: 4499,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
          metadata: azureMetadata,
        },
        {
          title: "Лагуна",
          subtitle: "Цепочка для очков • Колье • Держатель для очков",
          category_ids: [accessoriesCategory.id],
          description: "Элегантная цепочка SUNLUK с бусинами насыщенного зелёного оттенка, вдохновленная спокойствием морской лагуны. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
          handle: "lagoon",
          weight: 120,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Material",
              values: ["Lagoon"],
            },
          ],
          variants: [
            {
              title: "Lagoon",
              sku: "LAGOON-CHAIN",
              options: {
                Material: "Lagoon",
              },
              prices: [
                {
                  amount: 54,
                  currency_code: "eur",
                },
                {
                  amount: 59,
                  currency_code: "usd",
                },
                {
                  amount: 4499,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
          metadata: azureMetadata,
        },
        {
          title: "Фирменный мешочек",
          category_ids: [packagingCategory.id],
          description: "Фирменный хлопковый мешочек SUNLUK",
          handle: "velvet-pouch",
          weight: 50,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Default Option",
              values: ["Default Value"],
            },
          ],
          variants: [
            {
              title: "Default Variant",
              sku: "VELVET-POUCH",
              options: {
                "Default Option": "Default Value",
              },
              prices: [
                {
                  amount: 0,
                  currency_code: "eur",
                },
                {
                  amount: 0,
                  currency_code: "usd",
                },
                {
                  amount: 0,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
        {
          title: "Подарочная коробка",
          category_ids: [packagingCategory.id],
          description: "Премиальная подарочная коробка SUNLUK с тиснением",
          handle: "gift-box",
          weight: 100,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Default Option",
              values: ["Default Value"],
            },
          ],
          variants: [
            {
              title: "Default Variant",
              sku: "GIFT-BOX",
              options: {
                "Default Option": "Default Value",
              },
              prices: [
                {
                  amount: 5,
                  currency_code: "eur",
                },
                {
                  amount: 5,
                  currency_code: "usd",
                },
                {
                  amount: 500,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
        {
          title: "Шелковый мешочек",
          category_ids: [packagingCategory.id],
          description: "Шелковый мешочек для украшений",
          handle: "silk-pouch",
          weight: 30,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Default Option",
              values: ["Default Value"],
            },
          ],
          variants: [
            {
              title: "Default Variant",
              sku: "SILK-POUCH",
              options: {
                "Default Option": "Default Value",
              },
              prices: [
                {
                  amount: 2,
                  currency_code: "eur",
                },
                {
                  amount: 2,
                  currency_code: "usd",
                },
                {
                  amount: 200,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
        {
          title: "Деревянный футляр",
          category_ids: [packagingCategory.id],
          description: "Деревянный футляр для украшений",
          handle: "wooden-case",
          weight: 200,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Default Option",
              values: ["Default Value"],
            },
          ],
          variants: [
            {
              title: "Default Variant",
              sku: "WOODEN-CASE",
              options: {
                "Default Option": "Default Value",
              },
              prices: [
                {
                  amount: 10,
                  currency_code: "eur",
                },
                {
                  amount: 10,
                  currency_code: "usd",
                },
                {
                  amount: 1000,
                  currency_code: "rub",
                },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel.id,
            },
          ],
        },
        {
          title: "Фирменный мешочек (Бирюзового цвета)",
          category_ids: [packagingCategory.id],
          description: "Фирменный хлопковый мешочек бирюзового цвета SUNLUK",
          handle: "cotton-pouch-turquoise",
          weight: 50,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Default Option",
              values: ["Default Value"],
            },
          ],
          variants: [
            {
              title: "Default Variant",
              sku: "COTTON-POUCH-TURQUOISE",
              options: {
                "Default Option": "Default Value",
              },
              prices: [
                { amount: 3, currency_code: "eur" },
                { amount: 3, currency_code: "usd" },
                { amount: 300, currency_code: "rub" },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
        {
          title: "Фирменный мешочек (Коричневого цвета)",
          category_ids: [packagingCategory.id],
          description: "Фирменный хлопковый мешочек коричневого цвета SUNLUK",
          handle: "cotton-pouch-brown",
          weight: 50,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [],
          options: [
            {
              title: "Default Option",
              values: ["Default Value"],
            },
          ],
          variants: [
            {
              title: "Default Variant",
              sku: "COTTON-POUCH-BROWN",
              options: {
                "Default Option": "Default Value",
              },
              prices: [
                { amount: 3, currency_code: "eur" },
                { amount: 3, currency_code: "usd" },
                { amount: 300, currency_code: "rub" },
              ],
              manage_inventory: true,
            },
          ],
          sales_channels: [{ id: defaultSalesChannel.id }],
        },
  ];
  
  const productsData = rawProducts.map((p) => {
    const media = mediaMap[p.handle];
    return {
      ...p,
      thumbnail: media?.thumbnail ? getStaticUrl(media.thumbnail) : undefined,
      images: media?.images ? media.images.map((img) => ({ url: getStaticUrl(img) })) : [],
    };
  });

  const { result: productResults } = await createProductsWorkflow(container).run({
    input: {
      products: productsData,
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding product translations...");
  await createTranslationsWorkflow(container).run({
    input: {
      translations: [
        {
          reference_id: productResults[0].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Лазурь",
            subtitle: "Цепочка для очков • Колье • Держатель для очков",
            description: "Фирменная цепочка SUNLUK с лазурными акцентами, вдохновленными цветом моря. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
          },
        },
        {
          reference_id: productResults[0].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Azure",
            subtitle: "Eyewear Chain • Necklace • Eyewear Holder",
            description: "SUNLUK's signature eyewear chain featuring azure accents inspired by the colors of the sea. Easily transforms into an elegant necklace, while the signature ring keeps your glasses secure and within easy reach whenever you're not wearing them.",
          },
        },
        {
          reference_id: productResults[1].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Дюна",
            subtitle: "Держатель для очков • Колье • Подвес для очков",
            description: "Минималистичное украшение SUNLUK с фирменным кольцом в теплых природных оттенках. Носите его как стильное колье или закрепляйте очки на кольце, чтобы они всегда были под рукой.",
          },
        },
        {
          reference_id: productResults[1].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Dune",
            subtitle: "Eyewear Holder • Necklace • Glasses Pendant",
            description: "A minimalist SUNLUK accessory featuring the signature ring in warm, natural tones. Wear it as an elegant necklace or use the ring to keep your glasses secure and always within reach.",
          },
        },
        {
          reference_id: productResults[2].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Луна",
            subtitle: "Цепочка для очков • Колье • Держатель для очков",
            description: "Лаконичная серебристая цепочка SUNLUK в минималистичном дизайне. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
          },
        },
        {
          reference_id: productResults[2].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Luna",
            subtitle: "Eyewear Chain • Necklace • Eyewear Holder",
            description: "A minimalist silver-tone SUNLUK chain that easily transforms from an eyewear chain into an elegant necklace. The signature ring keeps your glasses secure and always within easy reach.",
          },
        },
        {
          reference_id: productResults[3].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Шелк",
            subtitle: "Цепочка для очков • Колье • Держатель для очков",
            description: "Элегантная цепочка SUNLUK с мягким плоским плетением и золотистым сиянием. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
          },
        },
        {
          reference_id: productResults[3].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Silk",
            subtitle: "Eyewear Chain • Necklace • Eyewear Holder",
            description: "An elegant SUNLUK chain with a smooth flat weave and a refined gold finish. Easily transforms into a stylish necklace, while the signature ring keeps your glasses secure and always within reach.",
          },
        },
        {
          reference_id: productResults[4].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Аметист",
            subtitle: "Цепочка для очков • Колье • Держатель для очков",
            description: "Эффектная цепочка SUNLUK с бусинами глубокого аметистового оттенка. Добавляет яркий акцент образу, легко превращается в стильное колье и позволяет удобно закрепить очки с помощью силиконовых держателей.",
          },
        },
        {
          reference_id: productResults[4].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Amethyst",
            subtitle: "Eyewear Chain • Necklace • Eyewear Holder",
            description: "A striking SUNLUK chain featuring deep amethyst-colored beads. Adds a bold touch to any look, transforms into an elegant necklace, and keeps your glasses secure with the included silicone loops.",
          },
        },
        {
          reference_id: productResults[5].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Лагуна",
            subtitle: "Цепочка для очков • Колье • Держатель для очков",
            description: "Элегантная цепочка SUNLUK с бусинами насыщенного зелёного оттенка, вдохновленная спокойствием морской лагуны. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
          },
        },
        {
          reference_id: productResults[5].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Lagoon",
            subtitle: "Eyewear Chain • Necklace • Eyewear Holder",
            description: "An elegant SUNLUK chain featuring rich green beads inspired by the calm waters of a tropical lagoon. Easily transforms into a stylish necklace, while the signature ring keeps your glasses secure and always within reach.",
          },
        },
        {
          reference_id: productResults[6].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Фирменный мешочек",
            description: "Фирменный хлопковый мешочек SUNLUK",
          },
        },
        {
          reference_id: productResults[6].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Velvet Pouch",
            description: "SUNLUK signature cotton pouch",
          },
        },
        {
          reference_id: productResults[7].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Подарочная коробка",
            description: "Премиальная подарочная коробка SUNLUK с тиснением",
          },
        },
        {
          reference_id: productResults[7].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Premium Gift Box",
            description: "Premium embossed SUNLUK gift box",
          },
        },
        {
          reference_id: productResults[8].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Шелковый мешочек",
            description: "Шелковый мешочек для украшений",
          },
        },
        {
          reference_id: productResults[8].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Silk Pouch",
            description: "Silk jewelry pouch",
          },
        },
        {
          reference_id: productResults[9].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Деревянный футляр",
            description: "Деревянный футляр для украшений",
          },
        },
        {
          reference_id: productResults[9].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Wooden Case",
            description: "Wooden jewelry case",
          },
        },
        {
          reference_id: productResults[10].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Фирменный мешочек (Бирюзового цвета)",
            description: "Фирменный хлопковый мешочек бирюзового цвета SUNLUK",
          },
        },
        {
          reference_id: productResults[10].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Branded Pouch (Turquoise)",
            description: "Branded turquoise cotton pouch SUNLUK",
          },
        },
        {
          reference_id: productResults[11].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Фирменный мешочек (Коричневого цвета)",
            description: "Фирменный хлопковый мешочек коричневого цвета SUNLUK",
          },
        },
        {
          reference_id: productResults[11].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Branded Pouch (Brown)",
            description: "Branded brown cotton pouch SUNLUK",
          },
        },
      ],
    },
  });
  logger.info("Finished seeding product translations.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });
  const { data: launchProducts } = await query.graph({
    entity: "product",
    fields: ["variants.inventory_items.inventory_item_id"],
    filters: {
      handle: ["dune", "silk"],
    },
  });
  const launchInventoryItemIds = new Set(
    launchProducts.flatMap((product) =>
      product.variants.flatMap((variant) =>
        variant.inventory_items?.flatMap((item) =>
          item?.inventory_item_id ? [item.inventory_item_id] : []
        ) ?? []
      )
    )
  );
  if (launchInventoryItemIds.size !== 2) {
    throw new Error(
      `Expected Dune and Silk to create two inventory items, found ${launchInventoryItemIds.size}.`
    );
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: launchInventoryItemIds.has(item.id) ? 0 : 1000000,
        inventory_item_id: item.id,
      })),
    },
  });

  logger.info("Finished seeding inventory levels data.");
}
