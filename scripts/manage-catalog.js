const fs = require("fs");
const path = require("path");

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL || "admin@test.com";
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD || "supersecret";

async function login() {
  const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Login failed (${res.status}): ${txt}`);
  }
  const data = await res.json();
  return data.token;
}

async function request(token, endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
    ...(options.headers || {}),
  };
  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Request to ${endpoint} failed (${res.status}): ${txt}`);
  }
  return res.json();
}

async function listProducts(token) {
  const productsData = await request(token, "/admin/products?limit=100");
  const inventoryData = await request(token, "/admin/inventory-items?limit=100");

  const inventoryMap = {};
  for (const item of inventoryData.inventory_items || []) {
    if (item.sku) {
      inventoryMap[item.sku.toLowerCase()] = item;
    }
  }

  console.log("\n=== CATALOG PRODUCTS ===\n");
  for (const product of productsData.products || []) {
    console.log(`Product: ${product.title} (Handle: ${product.handle}) [ID: ${product.id}]`);
    console.log(`Description: ${product.description || "N/A"}`);
    if (product.variants && product.variants.length > 0) {
      console.log("  Variants:");
      for (const variant of product.variants) {
        const skuKey = (variant.sku || "").toLowerCase();
        const invItem = inventoryMap[skuKey];
        const stock = invItem && invItem.location_levels && invItem.location_levels[0]
          ? invItem.location_levels[0].stocked_quantity
          : "N/A (manage_inventory: " + variant.manage_inventory + ")";

        const pricesStr = (variant.prices || [])
          .map((p) => `${p.amount} ${p.currency_code.toUpperCase()}`)
          .join(", ");

        console.log(`    - ${variant.title} (SKU: ${variant.sku || "N/A"}) [ID: ${variant.id}]`);
        console.log(`      Prices: ${pricesStr || "None"}`);
        console.log(`      Stock: ${stock}`);
      }
    } else {
      console.log("  No variants found.");
    }
    console.log("--------------------------------------------------");
  }
}

async function updateStock(token, sku, quantity) {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty)) {
    console.error("Error: Quantity must be a number");
    process.exit(1);
  }

  // Find inventory item by SKU
  const inventoryData = await request(token, `/admin/inventory-items?limit=100`);
  const item = (inventoryData.inventory_items || []).find(
    (i) => (i.sku || "").toLowerCase() === sku.toLowerCase()
  );

  if (!item) {
    console.error(`Error: Inventory item with SKU "${sku}" not found.`);
    process.exit(1);
  }

  const level = item.location_levels && item.location_levels[0];
  if (!level) {
    console.error(`Error: Inventory item has no associated location levels.`);
    process.exit(1);
  }

  const res = await request(token, `/admin/inventory-items/${item.id}/location-levels/${level.location_id}`, {
    method: "POST",
    body: JSON.stringify({ stocked_quantity: qty }),
  });

  console.log(`Successfully updated stock for SKU "${sku}" to ${qty}.`);
}

async function updatePrice(token, sku, currency, amount) {
  const val = parseFloat(amount);
  if (isNaN(val)) {
    console.error("Error: Amount must be a number");
    process.exit(1);
  }

  // Find variant and its parent product ID
  const productsData = await request(token, "/admin/products?limit=100");
  let foundVariant = null;
  let foundProduct = null;

  for (const product of productsData.products || []) {
    const v = (product.variants || []).find(
      (varItem) => (varItem.sku || "").toLowerCase() === sku.toLowerCase()
    );
    if (v) {
      foundVariant = v;
      foundProduct = product;
      break;
    }
  }

  if (!foundVariant || !foundProduct) {
    console.error(`Error: Product variant with SKU "${sku}" not found.`);
    process.exit(1);
  }

  // Update specific currency, keep other currencies
  const existingPrices = foundVariant.prices || [];
  const updatedPrices = [];
  let updatedExisting = false;

  for (const p of existingPrices) {
    if (p.currency_code.toLowerCase() === currency.toLowerCase()) {
      updatedPrices.push({
        amount: val,
        currency_code: currency.toLowerCase(),
      });
      updatedExisting = true;
    } else {
      updatedPrices.push({
        amount: p.amount,
        currency_code: p.currency_code,
      });
    }
  }

  if (!updatedExisting) {
    updatedPrices.push({
      amount: val,
      currency_code: currency.toLowerCase(),
    });
  }

  await request(token, `/admin/products/${foundProduct.id}/variants/${foundVariant.id}`, {
    method: "POST",
    body: JSON.stringify({ prices: updatedPrices }),
  });

  console.log(`Successfully updated price for SKU "${sku}" to ${val} ${currency.toUpperCase()}.`);
}

async function syncCatalog(token, filepath) {
  if (!fs.existsSync(filepath)) {
    console.error(`Error: File not found at ${filepath}`);
    process.exit(1);
  }

  const catalog = JSON.parse(fs.readFileSync(filepath, "utf8"));
  if (!Array.isArray(catalog)) {
    console.error("Error: Catalog file must contain a JSON array of products.");
    process.exit(1);
  }

  // Get active sales channel and shipping profile (to support creating new products if they don't exist)
  const productsData = await request(token, "/admin/products?limit=1");
  const firstProd = productsData.products && productsData.products[0];
  const shippingProfileId = firstProd ? firstProd.shipping_profile_id : null;
  const salesChannelId = firstProd && firstProd.sales_channels && firstProd.sales_channels[0]
    ? firstProd.sales_channels[0].id
    : null;

  console.log(`\nSyncing ${catalog.length} products from ${filepath}...\n`);

  for (const entry of catalog) {
    const handle = entry.handle || entry.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    
    // Check if product exists
    const searchData = await request(token, `/admin/products?handle=${handle}`);
    const existingProduct = searchData.products && searchData.products[0];

    if (existingProduct) {
      console.log(`Updating existing product: ${entry.title} (${handle})`);
      // Update basic product details
      await request(token, `/admin/products/${existingProduct.id}`, {
        method: "POST",
        body: JSON.stringify({
          title: entry.title,
          description: entry.description,
          subtitle: entry.subtitle,
        }),
      });

      // Match variants
      for (const vEntry of entry.variants || []) {
        const existingVariant = (existingProduct.variants || []).find(
          (ev) => (ev.sku || "").toLowerCase() === (vEntry.sku || "").toLowerCase()
        );

        if (existingVariant) {
          console.log(`  Updating variant SKU: ${vEntry.sku}`);
          // Update variant options / metadata if needed, and update prices
          const updatedPrices = Object.keys(vEntry.prices || {}).map((cc) => ({
            amount: vEntry.prices[cc],
            currency_code: cc.toLowerCase(),
          }));

          await request(token, `/admin/products/${existingProduct.id}/variants/${existingVariant.id}`, {
            method: "POST",
            body: JSON.stringify({
              title: vEntry.title || existingVariant.title,
              prices: updatedPrices,
            }),
          });

          // Sync stock/inventory
          if (vEntry.stock !== undefined && existingVariant.manage_inventory) {
            // Find inventory item
            const inventoryData = await request(token, `/admin/inventory-items?sku=${vEntry.sku}`);
            const item = (inventoryData.inventory_items || [])[0];
            if (item && item.location_levels && item.location_levels[0]) {
              await request(token, `/admin/inventory-items/${item.id}/location-levels/${item.location_levels[0].location_id}`, {
                method: "POST",
                body: JSON.stringify({ stocked_quantity: parseInt(vEntry.stock, 10) }),
              });
            }
          }
        } else {
          console.log(`  Creating new variant SKU: ${vEntry.sku} (not yet fully automated via CLI sync)`);
        }
      }
    } else {
      console.log(`Creating new product: ${entry.title} (${handle})`);
      if (!shippingProfileId || !salesChannelId) {
        console.error("  Cannot create new product: No existing shipping profile or sales channel found to clone.");
        continue;
      }

      // Build variants payload
      const variantsData = (entry.variants || []).map((v) => {
        const pricesPayload = Object.keys(v.prices || {}).map((cc) => ({
          amount: v.prices[cc],
          currency_code: cc.toLowerCase(),
        }));
        return {
          title: v.title || "Default",
          sku: v.sku,
          prices: pricesPayload,
          manage_inventory: true,
          options: entry.options ? v.options : { "Default Option": "Default Value" },
        };
      });

      const optionsPayload = entry.options || [
        {
          title: "Default Option",
          values: ["Default Value"],
        },
      ];

      const createPayload = {
        title: entry.title,
        handle,
        description: entry.description,
        subtitle: entry.subtitle,
        shipping_profile_id: shippingProfileId,
        sales_channels: [{ id: salesChannelId }],
        status: "published",
        options: optionsPayload,
        variants: variantsData,
      };

      const result = await request(token, "/admin/products", {
        method: "POST",
        body: JSON.stringify(createPayload),
      });

      const createdProduct = result.product;

      // Update inventory levels for new variants
      for (const v of entry.variants || []) {
        if (v.stock !== undefined) {
          // Wait briefly for Medusa to emit inventory items
          await new Promise((r) => setTimeout(r, 1000));
          const inventoryData = await request(token, `/admin/inventory-items?sku=${v.sku}`);
          const item = (inventoryData.inventory_items || [])[0];
          if (item && item.location_levels && item.location_levels[0]) {
            await request(token, `/admin/inventory-items/${item.id}/location-levels/${item.location_levels[0].location_id}`, {
              method: "POST",
              body: JSON.stringify({ stocked_quantity: parseInt(v.stock, 10) }),
            });
          }
        }
      }
      console.log(`  Product ${entry.title} created successfully.`);
    }
  }
  console.log("\nCatalog synchronization completed.\n");
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd) {
    console.log(`
Usage:
  node scripts/manage-catalog.js list
  node scripts/manage-catalog.js update-stock <sku> <quantity>
  node scripts/manage-catalog.js update-price <sku> <currency_code> <amount>
  node scripts/manage-catalog.js sync <filepath.json>
`);
    process.exit(0);
  }

  try {
    const token = await login();

    switch (cmd) {
      case "list":
        await listProducts(token);
        break;
      case "update-stock":
        if (args.length < 3) {
          console.error("Usage: node scripts/manage-catalog.js update-stock <sku> <quantity>");
          process.exit(1);
        }
        await updateStock(token, args[1], args[2]);
        break;
      case "update-price":
        if (args.length < 4) {
          console.error("Usage: node scripts/manage-catalog.js update-price <sku> <currency_code> <amount>");
          process.exit(1);
        }
        await updatePrice(token, args[1], args[2], args[3]);
        break;
      case "sync":
        if (args.length < 2) {
          console.error("Usage: node scripts/manage-catalog.js sync <filepath.json>");
          process.exit(1);
        }
        await syncCatalog(token, args[1]);
        break;
      default:
        console.error(`Unknown command: ${cmd}`);
        process.exit(1);
    }
  } catch (err) {
    console.error("Execution error:", err.message);
    process.exit(1);
  }
}

main();
