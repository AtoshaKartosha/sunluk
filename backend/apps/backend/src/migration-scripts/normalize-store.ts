import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createStoresWorkflow,
  updateStoresWorkflow,
  deleteStoresWorkflow,
} from "@medusajs/medusa/core-flows";

export async function normalizeStore(container: MedusaContainer, defaultSalesChannelId?: string) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const storeModuleService = container.resolve(Modules.STORE);

  logger.info("Normalizing store...");

  // 1. List Stores oldest-first
  const stores = await storeModuleService.listStores(
    {},
    {
      order: { created_at: "ASC" },
      relations: ["supported_currencies"],
    }
  );

  let targetStoreId: string;

  if (stores.length === 0) {
    logger.info("No stores exist. Creating a new Default Store...");

    let scId = defaultSalesChannelId;
    if (!scId) {
      const salesChannelService = container.resolve(Modules.SALES_CHANNEL);
      const channels = await salesChannelService.listSalesChannels({}, { take: 1 });
      scId = channels[0]?.id;
    }

    const { result: [newStore] } = await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: "Default Store",
            supported_currencies: [
              { currency_code: "eur", is_default: true },
              { currency_code: "usd", is_default: false },
              { currency_code: "rub", is_default: false },
            ],
            default_sales_channel_id: scId,
          },
        ],
      },
    });

    targetStoreId = newStore.id;
  } else {
    const oldestStore = stores[0];
    targetStoreId = oldestStore.id;
    logger.info(`Oldest store found: ${targetStoreId}. Updating it to match the currency invariant...`);

    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: targetStoreId },
        update: {
          supported_currencies: [
            { currency_code: "eur", is_default: true },
            { currency_code: "usd", is_default: false },
            { currency_code: "rub", is_default: false },
          ],
        },
      },
    });
  }

  // 2. Delete only extra Store rows
  if (stores.length > 1) {
    const extraStoreIds = stores.slice(1).map((s) => s.id);
    logger.info(`Found ${extraStoreIds.length} duplicate store(s). Deleting extra store rows: ${extraStoreIds.join(", ")}`);
    await deleteStoresWorkflow(container).run({
      input: {
        ids: extraStoreIds,
      },
    });
  }

  // 3. Finally re-read and enforce the exact invariant
  const finalStores = await storeModuleService.listStores(
    {},
    {
      relations: ["supported_currencies"],
    }
  );

  if (finalStores.length !== 1) {
    throw new Error(`Invariant violation: expected exactly 1 store, found ${finalStores.length}`);
  }

  const finalStore = finalStores[0];
  if (finalStore.id !== targetStoreId) {
    throw new Error(`Invariant violation: active store ID ${finalStore.id} does not match expected oldest ID ${targetStoreId}`);
  }

  const currencies = finalStore.supported_currencies || [];
  if (currencies.length !== 3) {
    throw new Error(`Invariant violation: expected exactly 3 supported currencies, found ${currencies.length}`);
  }

  const eur = currencies.find((c) => c.currency_code.toLowerCase() === "eur");
  const usd = currencies.find((c) => c.currency_code.toLowerCase() === "usd");
  const rub = currencies.find((c) => c.currency_code.toLowerCase() === "rub");

  if (!eur || !eur.is_default) {
    throw new Error("Invariant violation: EUR must be the default currency");
  }

  if (!usd || usd.is_default) {
    throw new Error("Invariant violation: USD must not be the default currency");
  }

  if (!rub || rub.is_default) {
    throw new Error("Invariant violation: RUB must not be the default currency");
  }

  logger.info("Store normalization complete. Invariant verified successfully.");
  return finalStore;
}

export default async function run_normalize_store({
  container,
}: {
  container: MedusaContainer;
}) {
  const store = await normalizeStore(container);
  return store;
}
