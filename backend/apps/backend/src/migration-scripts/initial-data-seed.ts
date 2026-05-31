import { MedusaContainer } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  createTranslationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

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

  await translationModuleService.createLocales([
    { code: "ru-RU", name: "Russian (Russia)" },
    { code: "en-US", name: "English (United States)" },
  ]);

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

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  // This is created by a migration script in core.
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  });
  const shippingProfile = shippingProfileResult[0];

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "European Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "Europe",
        geo_zones: [
          {
            country_code: "gb",
            type: "country",
          },
          {
            country_code: "de",
            type: "country",
          },
          {
            country_code: "dk",
            type: "country",
          },
          {
            country_code: "se",
            type: "country",
          },
          {
            country_code: "fr",
            type: "country",
          },
          {
            country_code: "es",
            type: "country",
          },
          {
            country_code: "it",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 10,
          },
          {
            currency_code: "eur",
            amount: 10,
          },
          {
            region_id: region.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Ship in 24 hours.",
          code: "express",
        },
        prices: [
          {
            currency_code: "usd",
            amount: 10,
          },
          {
            currency_code: "eur",
            amount: 10,
          },
          {
            region_id: region.id,
            amount: 10,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
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
      ],
    },
  });

  const accessoriesCategory = categoryResult[0];

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
