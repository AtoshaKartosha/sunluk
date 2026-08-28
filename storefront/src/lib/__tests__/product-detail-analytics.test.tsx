import React from "react";
import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VariantSelector } from "@/components/product/VariantSelector";
import {
  METRIKA_CONSENT_GRANTED_EVENT,
  setStoredConsent,
  initMetrika,
  resetMetrikaStateForTesting,
} from "@/components/analytics/analytics-consent";

vi.mock("@/components/cart/CartContext", () => ({
  useCart: () => ({ addItem: vi.fn() }),
}));

const labels = {
  selectAllOptions: "Select options",
  unavailable: "Unavailable",
  outOfStock: "Out of stock",
  preOrder: "Pre-order",
  invalidQuantity: "Invalid quantity",
  addToCart: "Add to cart",
  quantity: "Quantity",
  decreaseQuantity: "Decrease",
  increaseQuantity: "Increase",
  price: "Price",
  cost: "Cost",
  inStock: "In stock",
  lowStock: "Low stock",
  backorderAvailable: "Backorder available",
  notAvailable: "Not available",
  deliveryPromise: "Delivered in 2-3 days",
  adding: "Adding...",
  materialNames: {},
};

function variant(sku: string, amount: number) {
  return {
    id: `variant_${sku}`,
    sku,
    manage_inventory: false,
    options: [],
    calculated_price: {
      calculated_amount: amount,
      currency_code: "eur",
    },
  };
}

describe("product detail Metrika telemetry", () => {
  beforeEach(() => {
    localStorage.clear();
    resetMetrikaStateForTesting();
    delete window.ym;
    delete window.dataLayer;
  });

  it("gates detail by consent, emits only the current SKU on in-place grant, and deduplicates emitted SKUs", () => {
    const view = render(
      <VariantSelector
        options={[]}
        variants={[variant("SKU-ONE", 42)]}
        labels={labels}
        productId="product_123"
        productName="Product"
      />,
    );

    view.rerender(
      <VariantSelector
        options={[]}
        variants={[variant("SKU-TWO", 54)]}
        labels={labels}
        productId="product_123"
        productName="Product"
      />,
    );
    expect(window.dataLayer).toBeUndefined();

    let dataLayer!: NonNullable<Window["dataLayer"]>;
    act(() => {
      initMetrika();
      dataLayer = window.dataLayer!;
      delete window.ym;
      delete window.dataLayer;
      window.dispatchEvent(new Event(METRIKA_CONSENT_GRANTED_EVENT));
    });
    expect(dataLayer).toEqual([
      {
        ecommerce: {
          currencyCode: "EUR",
          detail: {
            products: [{ id: "SKU-TWO", name: "Product", price: 54, quantity: 1 }],
          },
        },
      },
    ]);

    view.rerender(
      <VariantSelector
        options={[]}
        variants={[variant("SKU-TWO", 54)]}
        labels={labels}
        productId="product_123"
        productName="Product"
      />,
    );
    view.rerender(
      <VariantSelector
        options={[]}
        variants={[variant("SKU-ONE", 42)]}
        labels={labels}
        productId="product_123"
        productName="Product"
      />,
    );
    view.rerender(
      <VariantSelector
        options={[]}
        variants={[variant("SKU-TWO", 54)]}
        labels={labels}
        productId="product_123"
        productName="Product"
      />,
    );
    view.rerender(
      <VariantSelector
        options={[]}
        variants={[variant("SKU-TWO", 54)]}
        labels={labels}
        productId="product_456"
        productName="Other Product"
      />,
    );

    expect(dataLayer).toEqual([
      {
        ecommerce: {
          currencyCode: "EUR",
          detail: {
            products: [{ id: "SKU-TWO", name: "Product", price: 54, quantity: 1 }],
          },
        },
      },
      {
        ecommerce: {
          currencyCode: "EUR",
          detail: {
            products: [{ id: "SKU-ONE", name: "Product", price: 42, quantity: 1 }],
          },
        },
      },
      {
        ecommerce: {
          currencyCode: "EUR",
          detail: {
            products: [{ id: "SKU-TWO", name: "Other Product", price: 54, quantity: 1 }],
          },
        },
      },
    ]);
  });

  it("initializes detail tracking from persisted granted consent", () => {
    setStoredConsent("granted");
    render(
      <VariantSelector
        options={[]}
        variants={[variant("SKU-ONE", 42)]}
        labels={labels}
        productId="product_123"
        productName="Product"
      />,
    );
    expect(window.dataLayer).toEqual([
      {
        ecommerce: {
          currencyCode: "EUR",
          detail: {
            products: [{ id: "SKU-ONE", name: "Product", price: 42, quantity: 1 }],
          },
        },
      },
    ]);
  });
});
