import { ModuleProvider, Modules } from "@medusajs/framework/utils";
import RegionalFulfillmentProviderService from "./service";

export default ModuleProvider(Modules.FULFILLMENT, {
  services: [RegionalFulfillmentProviderService],
});
