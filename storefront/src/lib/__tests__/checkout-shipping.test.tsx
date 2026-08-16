import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import CheckoutPage from "../../app/[locale]/checkout/page";
import type { StoreCart } from "../../components/cart/types";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/checkout",
}));

// Mock medusa cart and utility functions
vi.mock("@/lib/medusa/cart", () => ({
  updateCart: vi.fn(),
  getShippingOptions: vi.fn().mockResolvedValue([]),
  addShippingMethod: vi.fn(),
  createPaymentSessions: vi.fn(),
  completeCart: vi.fn(),
  clearCartId: vi.fn(),
}));

vi.mock("@/lib/medusa/regions", () => ({
  getStoreCountries: vi.fn().mockResolvedValue(["ru", "de"]),
}));

vi.mock("@/lib/medusa/customer", () => ({
  getClientCustomer: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/medusa/packaging-names", () => ({
  getPackagingName: vi.fn().mockReturnValue(""),
}));

// Mock the cart context hook
let mockCart: StoreCart | null = null;
const mockLoading = false;
const mockClearCart = vi.fn();
const mockSetCart = vi.fn();

vi.mock("../../components/cart/CartContext", () => ({
  useCart: () => ({
    cart: mockCart,
    loading: mockLoading,
    clearCart: mockClearCart,
    setCart: mockSetCart,
  }),
}));

describe("Checkout Shipping Display States", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders shippingPending when no shipping method has been selected", () => {
    mockCart = {
      id: "cart_123",
      items: [
        {
          id: "item_123",
          title: "Sunglasses",
          quantity: 1,
          unit_price: 499900,
          subtotal: 499900,
        },
      ],
      subtotal: 499900,
      tax_total: 0,
      discount_total: 0,
      shipping_total: 0,
      total: 499900,
      currency_code: "rub",
      shipping_methods: [], // empty -> pending
    } as unknown as StoreCart;

    render(<CheckoutPage />);
    
    expect(screen.getByText("shippingPending")).toBeInTheDocument();
  });

  it("renders shippingFree when a shipping method is selected and shipping_total is 0", () => {
    mockCart = {
      id: "cart_123",
      items: [
        {
          id: "item_123",
          title: "Sunglasses",
          quantity: 1,
          unit_price: 499900,
          subtotal: 499900,
        },
      ],
      subtotal: 499900,
      tax_total: 0,
      discount_total: 0,
      shipping_total: 0, // free
      total: 499900,
      currency_code: "rub",
      shipping_methods: [
        {
          id: "sm_123",
          shipping_option_id: "so_123",
        },
      ],
    } as unknown as StoreCart;

    render(<CheckoutPage />);

    expect(screen.getByText("shippingFree")).toBeInTheDocument();
  });

  it("renders formatted shipping total when a shipping method is selected and shipping_total > 0", () => {
    mockCart = {
      id: "cart_123",
      items: [
        {
          id: "item_123",
          title: "Sunglasses",
          quantity: 1,
          unit_price: 300000,
          subtotal: 300000,
        },
      ],
      subtotal: 300000,
      tax_total: 0,
      discount_total: 0,
      shipping_total: 800,
      total: 3800,
      currency_code: "rub",
      shipping_methods: [
        {
          id: "sm_123",
          shipping_option_id: "so_123",
        },
      ],
    } as unknown as StoreCart;

    render(<CheckoutPage />);

    // Verify formatted price presence (either 800 or ₽/RUB depending on number formatter)
    expect(screen.queryByText("shippingPending")).not.toBeInTheDocument();
    expect(screen.queryByText("shippingFree")).not.toBeInTheDocument();
    expect(screen.getByText("800 ₽")).toBeInTheDocument();
  });
});
