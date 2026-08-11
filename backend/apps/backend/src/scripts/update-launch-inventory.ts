import type { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows";

const launchHandles = ["dune", "silk"] as const;

type LaunchProduct = {
  handle: string;
  variants?: Array<{
    id: string;
    inventory_items?: Array<{ inventory_item_id: string }>;
  }>;
};

type InventoryLevel = {
  inventory_item_id: string;
  location_id: string;
  stocked_quantity: number;
};

function abort(message: string): never {
  throw new Error(`Launch inventory update aborted: ${message}. No inventory was changed.`);
}

export default async function update_launch_inventory({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({
    entity: "product",
    fields: [
      "handle",
      "variants.id",
      "variants.inventory_items.inventory_item_id",
    ],
    filters: { handle: [...launchHandles] },
  });
  const products = data as unknown as LaunchProduct[];
  const inventoryItemIds: string[] = [];

  for (const handle of launchHandles) {
    const matches = products.filter((product) => product.handle === handle);
    if (matches.length !== 1) {
      abort(`expected one product with handle "${handle}", found ${matches.length}`);
    }

    const [product] = matches;
    const variants = product.variants ?? [];
    if (variants.length !== 1) {
      abort(`expected one variant for "${handle}", found ${variants.length}`);
    }

    const [variant] = variants;
    const inventoryItems = variant.inventory_items ?? [];
    if (inventoryItems.length !== 1) {
      abort(
        `expected one inventory item linked to variant "${variant.id}" for "${handle}", found ${inventoryItems.length}`
      );
    }

    inventoryItemIds.push(inventoryItems[0].inventory_item_id);
  }

  if (new Set(inventoryItemIds).size !== inventoryItemIds.length) {
    abort("Dune and Silk variants resolve to the same inventory item");
  }

  const { data: levelData } = await query.graph({
    entity: "inventory_level",
    fields: ["inventory_item_id", "location_id", "stocked_quantity"],
    filters: { inventory_item_id: inventoryItemIds },
  });
  const levels = levelData as InventoryLevel[];

  for (const inventoryItemId of inventoryItemIds) {
    const itemLevels = levels.filter(
      (level) => level.inventory_item_id === inventoryItemId
    );
    if (!itemLevels.length) {
      abort(`inventory item "${inventoryItemId}" has no location levels`);
    }
    if (new Set(itemLevels.map((level) => level.location_id)).size !== itemLevels.length) {
      abort(`inventory item "${inventoryItemId}" has duplicate location levels`);
    }
  }

  const updates = levels
    .filter((level) => level.stocked_quantity !== 0)
    .map((level) => ({
      inventory_item_id: level.inventory_item_id,
      location_id: level.location_id,
      stocked_quantity: 0,
    }));

  if (updates.length) {
    await updateInventoryLevelsWorkflow(container).run({ input: { updates } });
  }

  logger.info(
    `Launch inventory is zero for Dune and Silk (${updates.length} level${updates.length === 1 ? "" : "s"} updated).`
  );
}
