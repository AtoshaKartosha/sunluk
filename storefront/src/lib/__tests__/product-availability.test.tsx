import { describe, expect, it } from "vitest";
import { projectAvailability } from "../price";

describe("catalog-browsing v3 product availability", () => {
  it("projects published zero-stock inventory as unavailable", () => {
    const publishedProduct = {
      status: "published",
      variants: [
        {
          manage_inventory: true,
          inventory_quantity: 0,
          allow_backorder: false,
        },
      ],
    };
    expect(projectAvailability(publishedProduct.variants[0])).toMatchObject({
      managed: true,
      quantity: 0,
      available: false,
      status: "outOfStock",
    });
  });
});
