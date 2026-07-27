import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys, ModuleRegistrationName, Modules } from "@medusajs/framework/utils";
import {
  createShippingOptionsWorkflow,
  deleteShippingOptionsWorkflow,
  type CreateShippingOptionsWorkflowInput,
} from "@medusajs/medusa/core-flows";
import { REGIONAL_FULFILLMENT_PROVIDER_ID } from "../modules/regional-fulfillment/service";

const OPTIONS = [
  { name: "Почта России", code: "russian-post" },
  { name: "СДЭК", code: "cdek" },
  { name: "Курьером по Москве", code: "moscow-courier" },
] as const;

export default async function applyFreeRussiaDelivery({ container }: { container: MedusaContainer }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const fulfillment = container.resolve(ModuleRegistrationName.FULFILLMENT);
  const link = container.resolve(ContainerRegistrationKeys.LINK);

  const [{ data: profiles }, { data: sets }, { data: regions }, { data: existing }, { data: locations }] = await Promise.all([
    query.graph({ entity: "shipping_profile", fields: ["id"] }),
    query.graph({ entity: "fulfillment_set", fields: ["id", "name", "service_zones.id", "service_zones.name"] }),
    query.graph({ entity: "region", fields: ["id", "name", "currency_code"] }),
    query.graph({ entity: "shipping_option", fields: ["id", "name", "service_zone_id", "provider_id"] }),
    query.graph({ entity: "stock_location", fields: ["id", "name"] }),
  ]);

  const shippingProfileId = profiles[0]?.id;
  const fulfillmentSet = sets.find((set) => set.name === "European Warehouse delivery");
  const existingRussiaServiceZone = fulfillmentSet?.service_zones?.find((zone) => zone.name === "Russia");
  const russiaRegion = regions.find((region) => region.currency_code === "rub");
  const stockLocation = locations.find((location) => location.name === "European Warehouse");
  if (!shippingProfileId || !fulfillmentSet || !russiaRegion || !stockLocation) {
    throw new Error("Russia shipping profile, fulfillment set, region, or stock location is missing");
  }
  const russiaServiceZoneId = existingRussiaServiceZone?.id ?? (await fulfillment.createServiceZones({
    fulfillment_set_id: fulfillmentSet.id,
    name: "Russia",
    geo_zones: [{ country_code: "ru", type: "country" }],
  })).id;

  const providerLinks = await link.list({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: REGIONAL_FULFILLMENT_PROVIDER_ID },
  });
  if (!providerLinks.length) {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: REGIONAL_FULFILLMENT_PROVIDER_ID },
    });
  }
  const obsolete = existing.filter(
    (option) =>
      option.service_zone_id === russiaServiceZoneId &&
      (option.provider_id === "manual_manual" ||
        (option.provider_id === REGIONAL_FULFILLMENT_PROVIDER_ID &&
          !OPTIONS.some(({ name }) => name === option.name))),
  );
  if (obsolete.length) {
    await deleteShippingOptionsWorkflow(container).run({ input: { ids: obsolete.map((option) => option.id) } });
  }

  const input: CreateShippingOptionsWorkflowInput = OPTIONS.filter(
    ({ name }) =>
      !existing.some(
        (option) =>
          option.service_zone_id === russiaServiceZoneId &&
          option.provider_id === REGIONAL_FULFILLMENT_PROVIDER_ID &&
          option.name === name,
      ),
  ).map(({ name, code }) => ({
    name,
    price_type: "flat" as const,
    provider_id: REGIONAL_FULFILLMENT_PROVIDER_ID,
    service_zone_id: russiaServiceZoneId,
    shipping_profile_id: shippingProfileId,
    type: { label: name, description: "Бесплатная доставка", code },
    prices: [
      { currency_code: "rub", amount: 0 },
      { region_id: russiaRegion.id, amount: 0 },
    ],
    rules: [
      { attribute: "enabled_in_store", value: "true", operator: "eq" as const },
      { attribute: "is_return", value: "false", operator: "eq" as const },
    ],
  }));

  if (input.length) await createShippingOptionsWorkflow(container).run({ input });
  logger.info(`Russia delivery options ready: ${OPTIONS.map(({ name }) => name).join(", ")}`);
}
