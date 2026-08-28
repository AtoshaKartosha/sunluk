import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CheckoutPage from "@/app/[locale]/checkout/page";
import {
  initMetrika,
  resetMetrikaStateForTesting,
  trackMetrikaPurchase,
} from "@/components/analytics/analytics-consent";
import { completeCart } from "@/lib/medusa/cart";
import type { StoreCart } from "@/components/cart/types";

const calls: string[] = [];
const push = vi.fn(() => calls.push("navigate"));
const clearCart = vi.fn(() => calls.push("clearCart"));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/checkout",
}));

vi.mock("@/lib/medusa/cart", () => ({
  updateCart: vi.fn().mockResolvedValue({}),
  getShippingOptions: vi.fn().mockResolvedValue([{ id: "shipping_123", name: "Shipping", amount: 0 }]),
  addShippingMethod: vi.fn().mockResolvedValue({}),
  createPaymentSessions: vi.fn().mockResolvedValue({}),
  completeCart: vi.fn(),
  clearCartId: vi.fn(() => calls.push("clearCartId")),
}));
vi.mock("@/lib/medusa/regions", () => ({
  getStoreCountries: vi.fn().mockResolvedValue(["dk"]),
}));
vi.mock("@/lib/medusa/customer", () => ({
  getClientCustomer: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/medusa/packaging-names", () => ({
  getPackagingName: vi.fn().mockReturnValue(""),
}));

let cart: StoreCart | null;
vi.mock("@/components/cart/CartContext", () => ({
  useCart: () => ({ cart, loading: false, clearCart, setCart: vi.fn() }),
}));

function fillContact() {
  for (const [id, value] of Object.entries({
    "checkout-email": "customer@example.com",
    "checkout-first-name": "Ada",
    "checkout-last-name": "Lovelace",
    "checkout-address": "1 Example Street",
    "checkout-city": "Copenhagen",
    "checkout-postal": "1050",
    "checkout-phone": "+4512345678",
  })) {
    fireEvent.change(document.getElementById(id)!, { target: { value } });
  }
  fireEvent.submit(screen.getByRole("button", { name: "continue" }).closest("form")!);
}

describe("checkout purchase telemetry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    calls.length = 0;
    resetMetrikaStateForTesting();
    delete window.ym;
    delete window.dataLayer;
    cart = {
      id: "cart_123",
      total: 108,
      currency_code: "eur",
      items: [{ id: "line_123", title: "Product", quantity: 1, unit_price: 108 }],
      shipping_methods: [],
    } as unknown as StoreCart;
  });

  it("pushes the exact completed-order purchase before cart clearing and navigation", async () => {
    const dataLayer: NonNullable<Window["dataLayer"]> = [];
    dataLayer.push = (...events) => {
      calls.push("purchase");
      return Array.prototype.push.apply(dataLayer, events);
    };
    window.dataLayer = dataLayer;
    initMetrika();
    vi.mocked(completeCart).mockResolvedValue({
      type: "order",
      order: {
        id: "order_123",
        display_id: 123,
        total: 108,
        currency_code: "eur",
        items: [{ variant_sku: "SKU-123", product_title: "Product", unit_price: 108, quantity: 1 }],
      },
    } as never);

    render(<CheckoutPage />);
    fillContact();
    await screen.findByRole("radio", { name: /shipping/i });
    fireEvent.click(screen.getByRole("radio", { name: /shipping/i }));
    fireEvent.submit(screen.getByRole("button", { name: "continueToPayment" }).closest("form")!);
    await screen.findByText("methodLabel");
    fireEvent.submit(screen.getByRole("button", { name: /placeOrderWithTotal/i }).closest("form")!);

    await waitFor(() => expect(calls).toEqual(["purchase", "clearCartId", "clearCart", "navigate"]));
    expect(Array.from(dataLayer)).toEqual([
      {
        ecommerce: {
          currencyCode: "EUR",
          purchase: {
            actionField: { id: "order_123", revenue: 108 },
            products: [{ id: "SKU-123", name: "Product", price: 108, quantity: 1 }],
          },
        },
      },
    ]);
  });

  it("rejects invalid orders without partial telemetry and deduplicates a successful order id", () => {
    initMetrika();
    expect(trackMetrikaPurchase({ id: "order_invalid", total: -10, currency_code: "eur", items: [{ product_id: "product_123", title: "Product", unit_price: 10, quantity: 1 }] })).toBe(false);
    expect(trackMetrikaPurchase({ id: "order_invalid", total: 10, currency_code: "eur", items: [{ title: "Missing identity", unit_price: 10, quantity: 1 }] })).toBe(false);
    expect(window.dataLayer).toEqual([]);

    const order = {
      id: "order_deduped",
      total: 10,
      currency_code: "eur",
      items: [{ variant_sku: " ", product_id: "product_123", product_title: " ", title: "Product", unit_price: 10, quantity: 1 }],
    };
    expect(trackMetrikaPurchase(order)).toBe(true);
    expect(trackMetrikaPurchase(order)).toBe(false);
    expect(window.dataLayer).toEqual([
      {
        ecommerce: {
          currencyCode: "EUR",
          purchase: {
            actionField: { id: "order_deduped", revenue: 10 },
            products: [{ id: "product_123", name: "Product", price: 10, quantity: 1 }],
          },
        },
      },
    ]);
  });

  it("continues the completed-order path when the purchase projection is invalid", async () => {
    const dataLayer: NonNullable<Window["dataLayer"]> = [];
    dataLayer.push = (...events) => {
      calls.push("purchase");
      return Array.prototype.push.apply(dataLayer, events);
    };
    window.dataLayer = dataLayer;
    initMetrika();
    vi.mocked(completeCart).mockResolvedValue({
      type: "order",
      order: {
        id: "order_invalid_projection",
        display_id: 124,
        total: 108,
        currency_code: "eur",
        items: [{ product_title: "Product", unit_price: 108, quantity: 1 }],
      },
    } as never);

    render(<CheckoutPage />);
    fillContact();
    await screen.findByRole("radio", { name: /shipping/i });
    fireEvent.click(screen.getByRole("radio", { name: /shipping/i }));
    fireEvent.submit(screen.getByRole("button", { name: "continueToPayment" }).closest("form")!);
    await screen.findByText("methodLabel");
    fireEvent.submit(screen.getByRole("button", { name: /placeOrderWithTotal/i }).closest("form")!);

    await waitFor(() => expect(calls).toEqual(["clearCartId", "clearCart", "navigate"]));
    expect(Array.from(dataLayer)).toEqual([]);
  });
});
