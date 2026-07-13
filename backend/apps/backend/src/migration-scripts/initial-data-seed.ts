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
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  createTranslationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
  deleteShippingOptionsWorkflow,
  CreateShippingOptionsWorkflowInput,
} from "@medusajs/medusa/core-flows";
import { REGIONAL_FULFILLMENT_PROVIDER_ID } from "../modules/regional-fulfillment/service";
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
  const {
    result: [defaultSalesChannel],
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

  const {
    result: [publishableApiKey],
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

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel.id],
    },
  });

  const {
    result: [store],
  } = await createStoresWorkflow(container).run({
    input: {
      stores: [
        {
          name: "Default Store",
          supported_currencies: [
            {
              currency_code: "eur",
              is_default: true,
            },
            {
              currency_code: "usd",
              is_default: false,
            },
            {
              currency_code: "rub",
              is_default: false,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      ],
    },
  });

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

  if (manualOptionsToCreate.length > 0) {
    await createShippingOptionsWorkflow(container).run({
      input: manualOptionsToCreate,
    });
  }

  // Seed regional calculated shipping options
  const hasEuropeCalculated = typedExistingOptions.some(
    (so) => so.provider_id === REGIONAL_FULFILLMENT_PROVIDER_ID && so.service_zone_id === europeServiceZone.id
  );
  const hasRussiaCalculated = typedExistingOptions.some(
    (so) => so.provider_id === REGIONAL_FULFILLMENT_PROVIDER_ID && so.service_zone_id === russiaServiceZone.id
  );

  const calculatedOptionsToCreate: CreateShippingOptionsWorkflowInput = [];
  if (!hasEuropeCalculated) {
    calculatedOptionsToCreate.push({
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
    });
  }

  if (!hasRussiaCalculated) {
    calculatedOptionsToCreate.push({
      name: "Standard Shipping (Calculated)",
      price_type: "calculated",
      provider_id: REGIONAL_FULFILLMENT_PROVIDER_ID,
      service_zone_id: russiaServiceZone.id,
      shipping_profile_id: shippingProfile.id,
      type: {
        label: "Standard",
        description: "Calculated delivery based on total",
        code: "standard-calculated-russia",
      },
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    });
  }

  if (calculatedOptionsToCreate.length > 0) {
    await createShippingOptionsWorkflow(container).run({
      input: calculatedOptionsToCreate,
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

  const { result: productResults } = await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Бирюза",
          category_ids: [accessoriesCategory.id],
          description: "Акцентный цвет и природные мотивы",
          handle: "turquoise-chain",
          weight: 120,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "/images/product-turquoise.webp",
            },
          ],
          options: [
            {
              title: "Material",
              values: ["Turquoise"],
            },
          ],
          variants: [
            {
              title: "Turquoise",
              sku: "TURQUOISE-CHAIN",
              options: {
                Material: "Turquoise",
              },
              prices: [
                {
                  amount: 49,
                  currency_code: "eur",
                },
                {
                  amount: 54,
                  currency_code: "usd",
                },
                {
                  amount: 4900,
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
          title: "Leather Loop",
          category_ids: [accessoriesCategory.id],
          description: "Натуральная кожа и премиальный металл",
          handle: "leather-loop",
          weight: 150,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "/images/product-leather.webp",
            },
          ],
          options: [
            {
              title: "Material",
              values: ["Leather"],
            },
          ],
          variants: [
            {
              title: "Leather",
              sku: "LEATHER-LOOP",
              options: {
                Material: "Leather",
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
                  amount: 5900,
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
          title: "Silver Chain",
          category_ids: [accessoriesCategory.id],
          description: "Минимализм, строгость и лёгкий блеск",
          handle: "silver-chain",
          weight: 100,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "/images/product-silver.webp",
            },
          ],
          options: [
            {
              title: "Material",
              values: ["Silver"],
            },
          ],
          variants: [
            {
              title: "Silver",
              sku: "SILVER-CHAIN",
              options: {
                Material: "Silver",
              },
              prices: [
                {
                  amount: 45,
                  currency_code: "eur",
                },
                {
                  amount: 49,
                  currency_code: "usd",
                },
                {
                  amount: 4500,
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
          title: "Sand Chain",
          category_ids: [accessoriesCategory.id],
          description: "Тёплый металл и морской песчаный оттенок",
          handle: "sand-chain",
          weight: 130,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "/images/product-sand.webp",
            },
          ],
          options: [
            {
              title: "Material",
              values: ["Gold-plated"],
            },
          ],
          variants: [
            {
              title: "Gold-plated",
              sku: "SAND-CHAIN",
              options: {
                Material: "Gold-plated",
              },
              prices: [
                {
                  amount: 55,
                  currency_code: "eur",
                },
                {
                  amount: 60,
                  currency_code: "usd",
                },
                {
                  amount: 5500,
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
      ],
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
            title: "Бирюза",
            description: "Акцентный цвет и природные мотивы",
          },
        },
        {
          reference_id: productResults[0].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Turquoise Chain",
            description: "Accent color and natural motifs",
          },
        },
        {
          reference_id: productResults[1].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Leather Loop",
            description: "Натуральная кожа и премиальный металл",
          },
        },
        {
          reference_id: productResults[1].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Leather Loop",
            description: "Genuine leather and premium metal",
          },
        },
        {
          reference_id: productResults[2].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Silver Chain",
            description: "Минимализм, строгость и лёгкий блеск",
          },
        },
        {
          reference_id: productResults[2].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Silver Chain",
            description: "Minimalism, rigor, and a light sheen",
          },
        },
        {
          reference_id: productResults[3].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Sand Chain",
            description: "Тёплый металл и морской песчаный оттенок",
          },
        },
        {
          reference_id: productResults[3].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Sand Chain",
            description: "Warm metal and sea-sand shade",
          },
        },
        {
          reference_id: productResults[4].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Фирменный мешочек",
            description: "Фирменный хлопковый мешочек SUNLUK",
          },
        },
        {
          reference_id: productResults[4].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Velvet Pouch",
            description: "SUNLUK signature cotton pouch",
          },
        },
        {
          reference_id: productResults[5].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Подарочная коробка",
            description: "Премиальная подарочная коробка SUNLUK с тиснением",
          },
        },
        {
          reference_id: productResults[5].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Premium Gift Box",
            description: "Premium embossed SUNLUK gift box",
          },
        },
        {
          reference_id: productResults[6].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Шелковый мешочек",
            description: "Шелковый мешочек для украшений",
          },
        },
        {
          reference_id: productResults[6].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Silk Pouch",
            description: "Silk jewelry pouch",
          },
        },
        {
          reference_id: productResults[7].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Деревянный футляр",
            description: "Деревянный футляр для украшений",
          },
        },
        {
          reference_id: productResults[7].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Wooden Case",
            description: "Wooden jewelry case",
          },
        },
        {
          reference_id: productResults[8].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Фирменный мешочек (Бирюзового цвета)",
            description: "Фирменный хлопковый мешочек бирюзового цвета SUNLUK",
          },
        },
        {
          reference_id: productResults[8].id,
          reference: "product",
          locale_code: "en-US",
          translations: {
            title: "Branded Pouch (Turquoise)",
            description: "Branded turquoise cotton pouch SUNLUK",
          },
        },
        {
          reference_id: productResults[9].id,
          reference: "product",
          locale_code: "ru-RU",
          translations: {
            title: "Фирменный мешочек (Коричневого цвета)",
            description: "Фирменный хлопковый мешочек коричневого цвета SUNLUK",
          },
        },
        {
          reference_id: productResults[9].id,
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

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems.map((item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 1000000,
        inventory_item_id: item.id,
      })),
    },
  });

  logger.info("Finished seeding inventory levels data.");
}
