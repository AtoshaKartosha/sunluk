import type { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, ModuleRegistrationName, ProductStatus } from "@medusajs/framework/utils";
import {
  createProductsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
  createInventoryLevelsWorkflow,
  deleteProductsWorkflow,
  createTranslationsWorkflow,
  updateTranslationsWorkflow
} from "@medusajs/medusa/core-flows";
import { ulid } from "ulid";

interface KnexInstance {
  raw: (sql: string, params?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
}

interface ProductModel {
  id: string;
  handle: string;
  options: Array<{
    id: string;
    title: string;
    values: Array<{ id: string; value: string }>;
  }>;
  variants: Array<{
    id: string;
    title: string;
    sku: string;
    price_set?: { id: string };
  }>;
}

interface ProductData {
  oldHandle: string | null;
  newHandle: string;
  ruTitle: string;
  enTitle: string;
  ruSubtitle: string;
  enSubtitle: string;
  ruDescription: string;
  enDescription: string;
  sku: string;
  prices: {
    rub: number;
    usd: number;
    eur: number;
  };
  metadata: Record<string, unknown>;
}

// Metadata definitions
const azureMetadata = {
  wear_it_your_way: {
    ru: [
      { "icon": "👓", "title": "Как цепочку для очков", "text": "Силиконовые держатели надежно фиксируются на большинстве оправ." },
      { "icon": "✨", "title": "Как колье", "text": "Снимите силиконовые держатели — аксессуар превращается в элегантное украшение." },
      { "icon": "🕶", "title": "Как держатель для очков", "text": "Закрепите очки на фирменном кольце, не снимая колье. Удобно, безопасно и всегда под рукой." }
    ],
    en: [
      { "icon": "👓", "title": "As an Eyewear Chain", "text": "Silicone loops securely fit most eyeglass frames." },
      { "icon": "✨", "title": "As a Necklace", "text": "Remove the silicone loops to transform it into an elegant everyday necklace." },
      { "icon": "🕶", "title": "As an Eyewear Holder", "text": "Attach your glasses to the signature ring without taking off the necklace. Secure, stylish, and always within reach." }
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
      { "icon": "👓", "title": "Как держатель для очков", "text": "Закрепите очки на фирменном кольце. Они всегда будут под рукой и не займут место в сумке или кармане." },
      { "icon": "✨", "title": "Как колье", "text": "Лаконичный дизайн делает аксессуар элегантным украшением на каждый день." },
      { "icon": "🕶", "title": "С очками на кольце", "text": "Повесьте очки на фирменное кольцо, не снимая колье. Удобно, безопасно и всегда под рукой." }
    ],
    en: [
      { "icon": "👓", "title": "As an Eyewear Holder", "text": "Attach your glasses to the signature ring to keep them secure and always within easy reach." },
      { "icon": "✨", "title": "As a Necklace", "text": "Its clean, minimalist design makes it an elegant everyday accessory." },
      { "icon": "🕶", "title": "With Glasses on the Ring", "text": "Hang your glasses on the signature ring without taking off the necklace. Secure, stylish, and always within reach." }
    ]
  },
  whats_included: {
    ru: ["Украшение SUNLUK (Длина – 72 см)", "Фирменное кольцо"],
    en: ["SUNLUK Accessory (Length: 72 cm)", "Signature Ring"]
  }
};

const productsData: ProductData[] = [
  {
    oldHandle: "turquoise-chain",
    newHandle: "azure",
    ruTitle: "Лазурь",
    enTitle: "Azure",
    ruSubtitle: "Цепочка для очков • Колье • Держатель для очков",
    enSubtitle: "Eyewear Chain • Necklace • Eyewear Holder",
    ruDescription: "Фирменная цепочка SUNLUK с лазурными акцентами, вдохновленными цветом моря. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
    enDescription: "SUNLUK's signature eyewear chain featuring azure accents inspired by the colors of the sea. Easily transforms into an elegant necklace, while the signature ring keeps your glasses secure and within easy reach whenever you're not wearing them.",
    sku: "AZURE-CHAIN",
    prices: { rub: 4999, usd: 65, eur: 59 },
    metadata: azureMetadata
  },
  {
    oldHandle: "leather-loop",
    newHandle: "dune",
    ruTitle: "Дюна",
    enTitle: "Dune",
    ruSubtitle: "Держатель для очков • Колье • Подвес для очков",
    enSubtitle: "Eyewear Holder • Necklace • Glasses Pendant",
    ruDescription: "Минималистичное украшение SUNLUK с фирменным кольцом в теплых природных оттенках. Носите его как стильное колье или закрепляйте очки на кольце, чтобы они всегда были под рукой.",
    enDescription: "A minimalist SUNLUK accessory featuring the signature ring in warm, natural tones. Wear it as an elegant necklace or use the ring to keep your glasses secure and always within reach.",
    sku: "DUNE-CHAIN",
    prices: { rub: 4999, usd: 65, eur: 59 },
    metadata: duneMetadata
  },
  {
    oldHandle: "silver-chain",
    newHandle: "luna",
    ruTitle: "Луна",
    enTitle: "Luna",
    ruSubtitle: "Цепочка для очков • Колье • Держатель для очков",
    enSubtitle: "Eyewear Chain • Necklace • Eyewear Holder",
    ruDescription: "Лаконичная серебристая цепочка SUNLUK в минималистичном дизайне. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
    enDescription: "A minimalist silver-tone SUNLUK chain that easily transforms from an eyewear chain into an elegant necklace. The signature ring keeps your glasses secure and always within easy reach.",
    sku: "LUNA-CHAIN",
    prices: { rub: 3999, usd: 50, eur: 45 },
    metadata: azureMetadata
  },
  {
    oldHandle: "sand-chain",
    newHandle: "silk",
    ruTitle: "Шелк",
    enTitle: "Silk",
    ruSubtitle: "Цепочка для очков • Колье • Держатель для очков",
    enSubtitle: "Eyewear Chain • Necklace • Eyewear Holder",
    ruDescription: "Элегантная цепочка SUNLUK с мягким плоским плетением и золотистым сиянием. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
    enDescription: "An elegant SUNLUK chain with a smooth flat weave and a refined gold finish. Easily transforms into a stylish necklace, while the signature ring keeps your glasses secure and always within reach.",
    sku: "SILK-CHAIN",
    prices: { rub: 4499, usd: 59, eur: 54 },
    metadata: azureMetadata
  },
  {
    oldHandle: "purple",
    newHandle: "amethyst",
    ruTitle: "Аметист",
    enTitle: "Amethyst",
    ruSubtitle: "Цепочка для очков • Колье • Держатель для очков",
    enSubtitle: "Eyewear Chain • Necklace • Eyewear Holder",
    ruDescription: "Эффектная цепочка SUNLUK с бусинами глубокого аметистового оттенка. Добавляет яркий акцент образу, легко превращается в стильное колье и позволяет удобно закрепить очки с помощью силиконовых держателей.",
    enDescription: "A striking SUNLUK chain featuring deep amethyst-colored beads. Adds a bold touch to any look, transforms into an elegant necklace, and keeps your glasses secure with the included silicone loops.",
    sku: "AMETHYST-CHAIN",
    prices: { rub: 4499, usd: 59, eur: 54 },
    metadata: azureMetadata
  },
  {
    oldHandle: "sun-chain",
    newHandle: "lagoon",
    ruTitle: "Лагуна",
    enTitle: "Lagoon",
    ruSubtitle: "Цепочка для очков • Колье • Держатель для очков",
    enSubtitle: "Eyewear Chain • Necklace • Eyewear Holder",
    ruDescription: "Элегантная цепочка SUNLUK с бусинами насыщенного зелёного оттенка, вдохновленная спокойствием морской лагуны. Легко трансформируется в стильное колье, а фирменное кольцо позволяет удобно закрепить очки, когда они не используются.",
    enDescription: "An elegant SUNLUK chain featuring rich green beads inspired by the calm waters of a tropical lagoon. Easily transforms into a stylish necklace, while the signature ring keeps your glasses secure and always within reach.",
    sku: "LAGOON-CHAIN",
    prices: { rub: 4499, usd: 59, eur: 54 },
    metadata: azureMetadata
  }
];

export default async function update_product_cards({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as unknown as KnexInstance;

  logger.info("Starting plan Step 3 SUNLUK product cards update...");

  // Fetch category, shipping profile, default sales channel, and stock location
  const { data: categoryResult } = await query.graph({
    entity: "product_category",
    fields: ["id"],
    filters: { name: "Accessories" }
  });
  if (categoryResult.length === 0) {
    throw new Error("Accessories category not found");
  }
  const accessoriesCategoryId = categoryResult[0].id as string;

  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { type: "default" }
  });
  if (shippingProfileResult.length === 0) {
    throw new Error("Default shipping profile not found");
  }
  const shippingProfileId = shippingProfileResult[0].id as string;

  const { data: salesChannelResult } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
    filters: { name: "Default Sales Channel" }
  });
  if (salesChannelResult.length === 0) {
    throw new Error("Default sales channel not found");
  }
  const defaultSalesChannelId = salesChannelResult[0].id as string;

  const { data: stockLocationResult } = await query.graph({
    entity: "stock_location",
    fields: ["id"],
  });
  if (stockLocationResult.length === 0) {
    throw new Error("No stock locations found");
  }
  const stockLocationId = stockLocationResult[0].id as string;

  // Helper to check if a product is referenced by orders
  const hasOrders = async (productId: string): Promise<boolean> => {
    const result = await knex.raw(
      "SELECT count(*) as count FROM order_line_item WHERE product_id = ?",
      [productId]
    );
    const countVal = result.rows[0]?.count;
    const count = typeof countVal === "string" ? parseInt(countVal, 10) : Number(countVal);
    return count > 0;
  };

  // Helper to check if a product is referenced by carts
  const hasCarts = async (productId: string): Promise<boolean> => {
    const result = await knex.raw(
      "SELECT count(*) as count FROM cart_line_item WHERE product_id = ?",
      [productId]
    );
    const countVal = result.rows[0]?.count;
    const count = typeof countVal === "string" ? parseInt(countVal, 10) : Number(countVal);
    return count > 0;
  };

  // Helper to upsert translations using standard workflows
  const upsertTranslation = async (
    referenceId: string,
    localeCode: string,
    translationsData: { title: string; subtitle: string; description: string }
  ) => {
    const existing = await knex.raw(
      "SELECT id FROM translation WHERE reference_id = ? AND locale_code = ? AND reference = 'product'",
      [referenceId, localeCode]
    );

    if (existing.rows.length > 0) {
      const transId = existing.rows[0].id as string;
      await updateTranslationsWorkflow(container).run({
        input: {
          translations: [
            {
              id: transId,
              translations: translationsData
            }
          ]
        }
      });
      logger.info(`Updated translations for product ${referenceId} and locale ${localeCode}`);
    } else {
      await createTranslationsWorkflow(container).run({
        input: {
          translations: [
            {
              reference_id: referenceId,
              reference: "product",
              locale_code: localeCode,
              translations: translationsData
            }
          ]
        }
      });
      logger.info(`Created translations for product ${referenceId} and locale ${localeCode}`);
    }
  };

  // Helper to upsert prices via Knex SQL
  // Justification: Medusa 2.0's IPricingModuleService throws Mikro-ORM index mapping errors
  // (e.g. "Trying to query by not existing property PriceSet.0") when updating price sets or price list rules.
  // Directly writing to SQL preserves system cache structures and safely updates prices.
  const upsertPrices = async (priceSetId: string, rub: number, usd: number, eur: number) => {
    const pricesToUpsert = [
      { currency: "eur", amount: eur },
      { currency: "usd", amount: usd },
      { currency: "rub", amount: rub }
    ];

    for (const p of pricesToUpsert) {
      const existing = await knex.raw(
        "SELECT id FROM price WHERE price_set_id = ? AND currency_code = ?",
        [priceSetId, p.currency]
      );

      const amtStr = p.amount.toString();
      const rawAmt = JSON.stringify({ value: amtStr, precision: 20 });

      if (existing.rows.length > 0) {
        const priceId = existing.rows[0].id as string;
        await knex.raw(
          "UPDATE price SET amount = ?, raw_amount = ?, updated_at = NOW() WHERE id = ?",
          [amtStr, rawAmt, priceId]
        );
      } else {
        const priceId = `price_${ulid().toLowerCase()}`;
        await knex.raw(
          "INSERT INTO price (id, price_set_id, currency_code, amount, raw_amount, rules_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, NOW(), NOW())",
          [priceId, priceSetId, p.currency, amtStr, rawAmt]
        );
      }
    }
  };

  for (const productData of productsData) {
    let oldProduct: ProductModel | null = null;
    let newProduct: ProductModel | null = null;

    // 1. Check if old product exists
    if (productData.oldHandle) {
      const { data: searchOld } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "handle",
          "options.id",
          "options.title",
          "options.values.id",
          "options.values.value",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.price_set.id"
        ],
        filters: { handle: productData.oldHandle }
      });
      if (searchOld.length > 0) {
        oldProduct = searchOld[0] as unknown as ProductModel;
      }
    }

    // 2. Check if new product exists
    const { data: searchNew } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "handle",
        "options.id",
        "options.title",
        "options.values.id",
        "options.values.value",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.price_set.id"
      ],
      filters: { handle: productData.newHandle }
    });
    if (searchNew.length > 0) {
      newProduct = searchNew[0] as unknown as ProductModel;
    }

    let targetProductId = "";
    let isCreated = false;

    // Handle Scenarios
    if (oldProduct && newProduct) {
      // Collision State: both exist
      logger.info(`Collision detected: both old product '${productData.oldHandle}' and new product '${productData.newHandle}' exist.`);
      const newHasOrders = await hasOrders(newProduct.id);
      const newHasCarts = await hasCarts(newProduct.id);
      const isReferenced = newHasOrders || newHasCarts;
      
      if (!isReferenced) {
        // Delete newProduct safely and remap oldProduct
        logger.info(`New product '${productData.newHandle}' (ID: ${newProduct.id}) has no references. Safely deleting it and remapping old product.`);
        await deleteProductsWorkflow(container).run({
          input: { ids: [newProduct.id] }
        });
        
        targetProductId = oldProduct.id;
        // Remap and update oldProduct
        await updateProductsWorkflow(container).run({
          input: {
            selector: { id: targetProductId },
            update: {
              handle: productData.newHandle,
              title: productData.ruTitle,
              subtitle: productData.ruSubtitle,
              description: productData.ruDescription,
              metadata: productData.metadata
            }
          }
        });
      } else {
        // newProduct has references, we cannot delete it.
        // Set it non-published and move it to a unique archived handle, then remap legacy ID.
        logger.info(`New product '${productData.newHandle}' (ID: ${newProduct.id}) is referenced. Archiving it and remapping old product.`);
        
        const archivedHandle = `archived-${productData.newHandle}-${newProduct.id.replace(/_/g, "-")}`.toLowerCase();
        await updateProductsWorkflow(container).run({
          input: {
            selector: { id: newProduct.id },
            update: {
              handle: archivedHandle,
              title: `${productData.ruTitle} (Archived)`,
              status: ProductStatus.DRAFT
            }
          }
        });

        // Avoid unique SKU constraint violations by renaming the archived variant SKUs
        if (newProduct.variants && newProduct.variants.length > 0) {
          for (const variant of newProduct.variants) {
            if (variant.sku) {
              const archivedSku = `${variant.sku}-archived-${newProduct.id.replace(/_/g, "-")}`.toLowerCase();
              await updateProductVariantsWorkflow(container).run({
                input: {
                  selector: { id: variant.id, product_id: newProduct.id },
                  update: {
                    sku: archivedSku
                  }
                }
              });
              logger.info(`Updated archived product variant SKU to '${archivedSku}' for variant '${variant.id}'`);

              // Update the linked inventory item's SKU to match to avoid unique constraint violations
              const linkRows = await knex.raw(
                "SELECT inventory_item_id FROM product_variant_inventory_item WHERE variant_id = ?",
                [variant.id]
              );
              if (linkRows.rows.length > 0) {
                const inventoryItemId = linkRows.rows[0].inventory_item_id as string;
                await knex.raw("UPDATE inventory_item SET sku = ? WHERE id = ?", [archivedSku, inventoryItemId]);
                logger.info(`Updated archived inventory item SKU to '${archivedSku}' for inventory item '${inventoryItemId}'`);
              }
            }
          }
        }

        targetProductId = oldProduct.id;
        await updateProductsWorkflow(container).run({
          input: {
            selector: { id: targetProductId },
            update: {
              handle: productData.newHandle,
              title: productData.ruTitle,
              subtitle: productData.ruSubtitle,
              description: productData.ruDescription,
              metadata: productData.metadata
            }
          }
        });
      }
    } else if (oldProduct) {
      // Only oldProduct exists - Normal remap
      targetProductId = oldProduct.id;
      logger.info(`Remapping old product '${productData.oldHandle}' to '${productData.newHandle}' (ID: ${targetProductId}).`);
      
      await updateProductsWorkflow(container).run({
        input: {
          selector: { id: targetProductId },
          update: {
            handle: productData.newHandle,
            title: productData.ruTitle,
            subtitle: productData.ruSubtitle,
            description: productData.ruDescription,
            metadata: productData.metadata
          }
        }
      });
    } else if (newProduct) {
      // Only newProduct exists - Normal idempotent update
      targetProductId = newProduct.id;
      logger.info(`Product '${productData.newHandle}' already exists. Idempotently updating it (ID: ${targetProductId}).`);
      
      await updateProductsWorkflow(container).run({
        input: {
          selector: { id: targetProductId },
          update: {
            title: productData.ruTitle,
            subtitle: productData.ruSubtitle,
            description: productData.ruDescription,
            metadata: productData.metadata
          }
        }
      });
    } else {
      // Neither exists - Create fresh
      logger.info(`Product '${productData.newHandle}' not found and no old product to remap. Creating fresh.`);
      
      const createResponse = await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: productData.ruTitle,
              category_ids: [accessoriesCategoryId],
              description: productData.ruDescription,
              subtitle: productData.ruSubtitle,
              handle: productData.newHandle,
              weight: 120,
              status: ProductStatus.PUBLISHED,
              shipping_profile_id: shippingProfileId,
              images: [],
              options: [
                {
                  title: "Material",
                  values: [productData.enTitle]
                }
              ],
              variants: [
                {
                  title: productData.enTitle,
                  sku: productData.sku,
                  options: { Material: productData.enTitle },
                  manage_inventory: true
                }
              ],
              sales_channels: [{ id: defaultSalesChannelId }],
              metadata: productData.metadata
            }
          ]
        }
      });

      const createdProducts = createResponse.result as unknown as Array<{ id: string }>;
      const freshProduct = createdProducts[0];
      targetProductId = freshProduct.id;
      isCreated = true;
    }

    // Now update options and variant fields for targetProductId
    // We refetch the current options/variants state
    const { data: refetchedList } = await query.graph({
      entity: "product",
      fields: [
        "options.id",
        "options.title",
        "options.values.id",
        "variants.id",
        "variants.price_set.id"
      ],
      filters: { id: targetProductId }
    });

    const activeProduct = refetchedList[0] as unknown as {
      options: Array<{
        id: string;
        title: string;
        values: Array<{ id: string; value: string }>;
      }>;
      variants: Array<{
        id: string;
        price_set?: { id: string };
      }>;
    };

    // Update product option title and value
    const materialOption = activeProduct.options[0];
    if (materialOption) {
      await knex.raw("UPDATE product_option SET title = 'Material' WHERE id = ?", [materialOption.id]);
      if (materialOption.values.length > 0) {
        const optValId = materialOption.values[0].id;
        await knex.raw("UPDATE product_option_value SET value = ? WHERE id = ?", [productData.enTitle, optValId]);
      }
    }

    // Update variant options and SKU
    if (activeProduct.variants.length > 0) {
      const variant = activeProduct.variants[0];
      await updateProductVariantsWorkflow(container).run({
        input: {
          selector: { id: variant.id, product_id: targetProductId },
          update: {
            title: productData.enTitle,
            sku: productData.sku,
            options: { Material: productData.enTitle }
          }
        }
      });

      // Fetch price set to upsert prices
      const priceSetId = variant.price_set?.id;
      if (priceSetId) {
        await upsertPrices(priceSetId, productData.prices.rub, productData.prices.usd, productData.prices.eur);
      }
    }

    // Upsert Translations
    await upsertTranslation(targetProductId, "ru-RU", {
      title: productData.ruTitle,
      subtitle: productData.ruSubtitle,
      description: productData.ruDescription
    });

    await upsertTranslation(targetProductId, "en-US", {
      title: productData.enTitle,
      subtitle: productData.enSubtitle,
      description: productData.enDescription
    });

    // Establish Inventory Levels if newly created
    if (isCreated) {
      const { data: checkVariants } = await query.graph({
        entity: "product_variant",
        fields: ["id"],
        filters: { product_id: targetProductId }
      });

      if (checkVariants.length > 0) {
        const vData = checkVariants[0] as unknown as { id: string };
        const variantId = vData.id;

        const linkRows = await knex.raw(
          "SELECT inventory_item_id FROM product_variant_inventory_item WHERE variant_id = ?",
          [variantId]
        );

        if (linkRows.rows.length > 0) {
          const inventoryItemId = linkRows.rows[0].inventory_item_id as string;

          const levelRows = await knex.raw(
            "SELECT id FROM inventory_level WHERE inventory_item_id = ? AND location_id = ?",
            [inventoryItemId, stockLocationId]
          );

          if (levelRows.rows.length === 0) {
            await createInventoryLevelsWorkflow(container).run({
              input: {
                inventory_levels: [
                  {
                    location_id: stockLocationId,
                    stocked_quantity: 1000000,
                    inventory_item_id: inventoryItemId
                  }
                ]
              }
            });
            logger.info(`Established inventory levels for fresh product: ${productData.newHandle}`);
          }
        }
      }
    }
  }

  logger.info("SUNLUK product cards update completed successfully!");
}
