import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { updateCart } from "@/lib/medusa/cart";
import CheckoutPage from "../../app/[locale]/checkout/page";
import type { StoreCart } from "../../components/cart/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/checkout",
}));

vi.mock("@/lib/medusa/cart", () => ({
  updateCart: vi.fn(),
  getShippingOptions: vi.fn().mockResolvedValue([]),
  addShippingMethod: vi.fn(),
  createPaymentSessions: vi.fn(),
  completeCart: vi.fn(),
  clearCartId: vi.fn(),
}));

vi.mock("@/lib/medusa/regions", () => ({
  getRegionCountries: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/medusa/customer", () => ({
  getClientCustomer: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/medusa/packaging-names", () => ({
  getPackagingName: vi.fn().mockReturnValue(""),
}));

let mockCart: StoreCart | null = null;
const mockSetCart = vi.fn();

vi.mock("../../components/cart/CartContext", () => ({
  useCart: () => ({
    cart: mockCart,
    loading: false,
    clearCart: vi.fn(),
    setCart: mockSetCart,
  }),
}));

function fillContact(phone: string) {
  const fields = {
    "checkout-email": "customer@example.com",
    "checkout-first-name": "Ada",
    "checkout-last-name": "Lovelace",
    "checkout-address": "1 Example Street",
    "checkout-city": "Copenhagen",
    "checkout-postal": "1050",
    "checkout-phone": phone,
  };

  for (const [id, value] of Object.entries(fields)) {
    fireEvent.change(document.getElementById(id)!, { target: { value } });
  }
}

function submitContact() {
  fireEvent.submit(screen.getByRole("button", { name: "continue" }).closest("form")!);
}

describe("Checkout contact phone", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCart = {
      id: "cart_123",
      currency_code: "dkk",
      items: [
        {
          id: "item_123",
          title: "Test product",
          quantity: 1,
          unit_price: 1000,
          total: 1000,
        },
      ],
      shipping_methods: [],
    } as unknown as StoreCart;
  });

  it.each(["", "+1", "49 170 1234567", "+4917012345678901"])(
    "keeps contact active without updating the cart for phone %j",
    (phone) => {
      render(<CheckoutPage />);
      fillContact(phone);
      submitContact();

      const phoneInput = document.getElementById("checkout-phone")!;
      expect(phoneInput).toHaveFocus();
      expect(phoneInput).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("validation.phone")).toBeInTheDocument();
      expect(updateCart).not.toHaveBeenCalled();
      expect(document.getElementById("checkout-email")).toBeInTheDocument();
    },
  );

  it("normalizes presentation separators and advances after the cart update resolves", async () => {
    let resolveUpdate!: (cart: StoreCart) => void;
    const update = new Promise<StoreCart>((resolve) => {
      resolveUpdate = resolve;
    });
    vi.mocked(updateCart).mockReturnValue(update as never);

    render(<CheckoutPage />);
    fillContact("+49 (170) 123-4567");
    submitContact();

    expect(updateCart).toHaveBeenCalledWith("cart_123", {
      email: "customer@example.com",
      shipping_address: expect.objectContaining({ phone: "+491701234567" }),
      billing_address: expect.objectContaining({ phone: "+491701234567" }),
    });
    expect(document.getElementById("checkout-email")).toBeInTheDocument();

    resolveUpdate(mockCart!);
    await waitFor(() => {
      expect(document.getElementById("checkout-email")).not.toBeInTheDocument();
    });
  });
});
