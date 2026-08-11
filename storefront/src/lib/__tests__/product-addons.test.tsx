import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProductInfoBlock } from "../../components/product/ProductInfoBlock";
import type { StoreProduct } from "../../components/product/types";

vi.mock("../../components/product/VariantSelector", () => ({
  VariantSelector: ({ selectedPackagingVariantId }: { selectedPackagingVariantId: string | null }) => (
    <output data-testid="selected-packaging-variant">{selectedPackagingVariantId ?? "none"}</output>
  ),
}));

const product: StoreProduct = {
  id: "product_1",
  title: "Main product",
  handle: "main-product",
  options: [],
  variants: [],
};

function packagingProduct(
  handle: string,
  title: string,
  calculatedPrice: unknown,
): StoreProduct {
  return {
    id: handle,
    title,
    handle,
    variants: [
      {
        id: `${handle}_variant`,
        manage_inventory: false,
        calculated_price: calculatedPrice as never,
      },
    ],
  };
}

describe("ProductInfoBlock packaging prices", () => {
  it("seeds the zero-priced velvet pouch as the selected cart-bound packaging", () => {
    render(
      <ProductInfoBlock
        product={product}
        price={null}
        packagingProducts={[
          packagingProduct("velvet-pouch", "Velvet pouch", {
            calculated_amount: 0,
            currency_code: "rub",
          }),
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: /velvet pouch/i })).not.toBeDisabled();
    expect(screen.getByText("Бесплатно")).toBeInTheDocument();
    expect(screen.getByTestId("selected-packaging-variant")).toHaveTextContent("velvet-pouch_variant");
  });

  it.each([
    ["missing amount", { calculated_amount: null, currency_code: "rub" }],
    ["missing currency", { calculated_amount: 100 }],
  ])("disables and omits the velvet pouch with %s", (title, calculatedPrice) => {
    render(
      <ProductInfoBlock
        product={product}
        price={null}
        packagingProducts={[packagingProduct("velvet-pouch", `Velvet pouch (${title})`, calculatedPrice)]}
      />,
    );

    expect(screen.getByRole("button", { name: new RegExp(title, "i") })).toBeDisabled();
    expect(screen.getByTestId("selected-packaging-variant")).toHaveTextContent("none");
  });
});
