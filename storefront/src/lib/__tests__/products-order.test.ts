import { describe, expect, it } from "vitest";
import { orderProducts } from "../medusa/products";

describe("catalog-browsing v3 product order", () => {
  it("uses the canonical launch order", () => {
    const products = ["silk", "luna", "dune", "azure", "lagoon", "amethyst"].map(
      (handle) => ({ handle }),
    );

    expect(orderProducts(products).map((product) => product.handle)).toEqual([
      "lagoon",
      "azure",
      "amethyst",
      "luna",
      "dune",
      "silk",
    ]);
  });

  it("keeps remaining canonical products ordered and sorts unknown handles", () => {
    const products = ["zebra", "silk", "amber", "dune", "azure"].map(
      (handle) => ({ handle }),
    );

    expect(orderProducts(products).map((product) => product.handle)).toEqual([
      "azure",
      "dune",
      "silk",
      "amber",
      "zebra",
    ]);
  });
});
