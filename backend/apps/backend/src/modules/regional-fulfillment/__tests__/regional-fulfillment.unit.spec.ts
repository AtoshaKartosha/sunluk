import RegionalFulfillmentProviderService from "../service";
import { CalculateShippingOptionPriceDTO } from "@medusajs/framework/types";

describe("RegionalFulfillmentProviderService", () => {
  let service: RegionalFulfillmentProviderService;

  beforeEach(() => {
    service = new RegionalFulfillmentProviderService({}, {});
  });

  it("should return correct fulfillment options", async () => {
    const options = await service.getFulfillmentOptions();
    expect(options).toEqual([
      {
        id: "regional-delivery",
        name: "Regional Delivery",
      },
    ]);
  });

  it("should validate options successfully", async () => {
    const isValid = await service.validateOption({});
    expect(isValid).toBe(true);
  });

  it("should validate fulfillment data by returning it", async () => {
    const data = { test: "data" };
    const validated = await service.validateFulfillmentData({}, data, {});
    expect(validated).toEqual(data);
  });

  describe("canCalculate", () => {
    it("should return true unconditionally for creation data without runtime currency", async () => {
      const canCalc = await service.canCalculate({} as unknown as Parameters<typeof service.canCalculate>[0]);
      expect(canCalc).toBe(true);
    });
  });

  describe("calculatePrice", () => {
    it("should charge 800 RUB for shipping when RUB subtotal is below 4999", async () => {
      const context = {
        currency_code: "rub",
        item_subtotal: 4998,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result).toEqual({
        calculated_amount: 800,
        is_calculated_price_tax_inclusive: true,
      });
    });

    it("should charge 0 RUB for shipping when RUB subtotal is exactly 4999", async () => {
      const context = {
        currency_code: "rub",
        item_subtotal: 4999,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result).toEqual({
        calculated_amount: 0,
        is_calculated_price_tax_inclusive: true,
      });
    });

    it("should charge 0 RUB for shipping when RUB subtotal is greater than 4999", async () => {
      const context = {
        currency_code: "rub",
        item_subtotal: 5000,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result).toEqual({
        calculated_amount: 0,
        is_calculated_price_tax_inclusive: true,
      });
    });

    it("should charge 10 EUR for shipping when EUR subtotal is below 60", async () => {
      const context = {
        currency_code: "eur",
        item_subtotal: 59.99,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result).toEqual({
        calculated_amount: 10,
        is_calculated_price_tax_inclusive: true,
      });
    });

    it("should charge 0 EUR for shipping when EUR subtotal is exactly 60", async () => {
      const context = {
        currency_code: "eur",
        item_subtotal: 60,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result).toEqual({
        calculated_amount: 0,
        is_calculated_price_tax_inclusive: true,
      });
    });

    it("should charge 0 EUR for shipping when EUR subtotal is greater than 60", async () => {
      const context = {
        currency_code: "eur",
        item_subtotal: 61,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result).toEqual({
        calculated_amount: 0,
        is_calculated_price_tax_inclusive: true,
      });
    });

    it("should fall back to subtotal if item_subtotal is missing", async () => {
      const context = {
        currency_code: "rub",
        subtotal: 4000,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result.calculated_amount).toBe(800);
    });

    it("should support BigNumberValue object formats", async () => {
      const context = {
        currency_code: "eur",
        item_subtotal: { value: 65 },
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result.calculated_amount).toBe(0);
    });
    it("should throw an error for unsupported currency codes", async () => {
      const context = {
        currency_code: "usd",
        item_subtotal: 100,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      await expect(service.calculatePrice({}, {}, context)).rejects.toThrow(
        "Unsupported currency code for regional shipping: usd"
      );
    });

    it("should prioritize item_total over item_subtotal and subtotal", async () => {
      const context = {
        currency_code: "rub",
        item_total: 4000,
        item_subtotal: 5000,
        subtotal: 6000,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result.calculated_amount).toBe(800);
    });

    it("should prove product-discount transition (free shipping based on subtotal, but paid shipping based on discounted total)", async () => {
      const context = {
        currency_code: "eur",
        item_total: 55,
        item_subtotal: 65,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      const result = await service.calculatePrice({}, {}, context);
      expect(result.calculated_amount).toBe(10);
    });

    it("should throw when currency code is missing", async () => {
      const context = {
        item_total: 55,
      } as unknown as CalculateShippingOptionPriceDTO["context"];

      await expect(service.calculatePrice({}, {}, context)).rejects.toThrow(
        "Currency code is missing"
      );
    });
  });

  describe("createReturnFulfillment", () => {
    it("should successfully create return fulfillment", async () => {
      const data = { return_id: "ret_123" };
      const result = await service.createReturnFulfillment(data);
      expect(result).toEqual({
        data,
        labels: [],
      });
    });
  });
});
