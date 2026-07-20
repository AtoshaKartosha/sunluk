export const REGIONAL_FULFILLMENT_PROVIDER_ID = "regional-fulfillment_regional-fulfillment";

import { AbstractFulfillmentProviderService } from "@medusajs/framework/utils";
import {
  CalculatedShippingOptionPrice,
  CalculateShippingOptionPriceDTO,
  CreateShippingOptionDTO,
  CreateFulfillmentResult,
  FulfillmentItemDTO,
  FulfillmentOrderDTO,
  FulfillmentDTO,
  FulfillmentOption
} from "@medusajs/framework/types";

class RegionalFulfillmentProviderService extends AbstractFulfillmentProviderService {
  static identifier = "regional-fulfillment";

  constructor(
    _container: unknown,
    _options: Record<string, unknown>
  ) {
    super();
  }

  async getFulfillmentOptions(): Promise<FulfillmentOption[]> {
    return [
      {
        id: "regional-delivery",
        name: "Regional Delivery",
      },
    ];
  }

  async validateOption(_data: Record<string, unknown>): Promise<boolean> {
    return true;
  }

  async validateFulfillmentData(
    _optionData: Record<string, unknown>,
    data: Record<string, unknown>,
    _context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    return data;
  }

  async canCalculate(data: CreateShippingOptionDTO): Promise<boolean> {
    let currencyCode: string | undefined;

    if (data.rules && Array.isArray(data.rules)) {
      const currencyRule = data.rules.find((r) => r.attribute === "currency_code");
      if (currencyRule) {
        if (typeof currencyRule.value === "string") {
          currencyCode = currencyRule.value;
        } else if (Array.isArray(currencyRule.value) && currencyRule.value.length > 0) {
          const firstVal = currencyRule.value[0];
          if (typeof firstVal === "string") {
            currencyCode = firstVal;
          }
        }
      }
    }

    if (!currencyCode) {
      const dataUnknown = data as unknown;
      if (dataUnknown && typeof dataUnknown === "object") {
        if ("currency_code" in dataUnknown && typeof dataUnknown.currency_code === "string") {
          currencyCode = dataUnknown.currency_code;
        } else if ("context" in dataUnknown && dataUnknown.context && typeof dataUnknown.context === "object" && "currency_code" in dataUnknown.context && typeof dataUnknown.context.currency_code === "string") {
          currencyCode = dataUnknown.context.currency_code;
        } else if ("optionData" in dataUnknown && dataUnknown.optionData && typeof dataUnknown.optionData === "object" && "currency_code" in dataUnknown.optionData && typeof dataUnknown.optionData.currency_code === "string") {
          currencyCode = dataUnknown.optionData.currency_code;
        }
      }
    }

    if (!currencyCode) {
      return false;
    }

    const code = currencyCode.toLowerCase();
    return code === "rub" || code === "eur";
  }

  async calculatePrice(
    _optionData: CalculateShippingOptionPriceDTO["optionData"],
    _data: CalculateShippingOptionPriceDTO["data"],
    context: CalculateShippingOptionPriceDTO["context"]
  ): Promise<CalculatedShippingOptionPrice> {
    const currencyCode = typeof context?.currency_code === "string" ? context.currency_code.toLowerCase() : "";
    if (!currencyCode) {
      throw new Error("Currency code is missing");
    }
    if (currencyCode !== "rub" && currencyCode !== "eur") {
      throw new Error(`Unsupported currency code for regional shipping: ${currencyCode}`);
    }
    
    // Determine subtotal from context (item_total takes priority, then item_subtotal, then subtotal fallback)
    const rawSubtotal = context?.item_total ?? context?.item_subtotal ?? context?.subtotal;
    let subtotal = 0;
    
    if (typeof rawSubtotal === "number") {
      subtotal = rawSubtotal;
    } else if (typeof rawSubtotal === "string") {
      subtotal = parseFloat(rawSubtotal);
    } else if (rawSubtotal && typeof rawSubtotal === "object") {
      // BigNumberValue handling
      if ("value" in rawSubtotal && typeof rawSubtotal.value === "number") {
        subtotal = rawSubtotal.value;
      } else if ("value" in rawSubtotal && typeof rawSubtotal.value === "string") {
        subtotal = parseFloat(rawSubtotal.value);
      } else if ("raw" in rawSubtotal && rawSubtotal.raw && typeof rawSubtotal.raw === "object" && "value" in rawSubtotal.raw) {
        const rawVal = rawSubtotal.raw.value;
        if (typeof rawVal === "number") {
          subtotal = rawVal;
        } else if (typeof rawVal === "string") {
          subtotal = parseFloat(rawVal);
        }
      }
    }

    if (currencyCode === "rub") {
      // Russia/RUB: discounted merchandise total < 4,999 RUB → 800 RUB shipping; >= 4,999 RUB → 0
      const price = subtotal < 4999 ? 800 : 0;
      return {
        calculated_amount: price,
        is_calculated_price_tax_inclusive: true,
      };
    } else if (currencyCode === "eur") {
      // Europe/EUR: < 60 EUR → 10 EUR; >= 60 EUR → 0
      const price = subtotal < 60 ? 10 : 0;
      return {
        calculated_amount: price,
        is_calculated_price_tax_inclusive: true,
      };
    }

    throw new Error(`Unsupported currency code for regional shipping: ${currencyCode}`);
  }

  async createFulfillment(
    data: Record<string, unknown>,
    _items: Partial<Omit<FulfillmentItemDTO, "fulfillment">>[],
    _order: Partial<FulfillmentOrderDTO> | undefined,
    _fulfillment: Partial<Omit<FulfillmentDTO, "provider_id" | "data" | "items">>
  ): Promise<CreateFulfillmentResult> {
    return {
      data,
      labels: [],
    };
  }

  async createReturnFulfillment(
    fromData: Record<string, unknown>
  ): Promise<CreateFulfillmentResult> {
    return {
      data: fromData,
      labels: [],
    };
  }

  async cancelFulfillment(_fulfillment: Record<string, unknown>): Promise<Record<string, unknown>> {
    return {};
  }
}

export default RegionalFulfillmentProviderService;
