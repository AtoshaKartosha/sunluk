import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CheckoutPage from "../../app/[locale]/checkout/page";
import type { StoreCart } from "../../components/cart/types";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/checkout",
}));

// Mock medusa cart helpers
vi.mock("@/lib/medusa/cart", () => ({
  updateCart: vi.fn(),
  getShippingOptions: vi.fn().mockResolvedValue([]),
  addShippingMethod: vi.fn(),
  createPaymentSessions: vi.fn(),
  completeCart: vi.fn(),
  clearCartId: vi.fn(),
  applyPromotion: vi.fn(),
}));

// Mock store countries for checkout address step
vi.mock("@/lib/medusa/regions", () => ({
  getStoreCountries: vi.fn().mockResolvedValue(["gb", "de", "dk", "se", "fr", "es", "it", "ru"]),
}));

vi.mock("@/lib/medusa/customer", () => ({
  getClientCustomer: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/medusa/packaging-names", () => ({
  getPackagingName: vi.fn().mockReturnValue(""),
}));

// Mock CartContext hook
let mockCart: StoreCart | null = null;
let mockMutating = false;
const mockSetCart = vi.fn();
const mockApplyPromotion = vi.fn();

vi.mock("../../components/cart/CartContext", () => ({
  useCart: () => ({
    cart: mockCart,
    loading: false,
    mutating: mockMutating,
    clearCart: vi.fn(),
    setCart: mockSetCart,
    applyPromotion: mockApplyPromotion,
  }),
}));

const sampleCart: StoreCart = {
  id: "cart_123",
  region_id: "reg_123",
  currency_code: "rub",
  total: 5000,
  subtotal: 5000,
  tax_total: 0,
  discount_total: 0,
  shipping_total: 0,
  item_total: 5000,
  item_subtotal: 5000,
  item_tax_total: 0,
  item_count: 1,
  items: [
    {
      id: "item_1",
      title: "Sunglasses Case",
      quantity: 1,
      unit_price: 5000,
      total: 5000,
    },
  ],
};

describe("Checkout Promotions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCart = { ...sampleCart, promotions: [] };
    mockMutating = false;
  });

  it("prevents empty submission and shows local validation error without calling applyPromotion", async () => {
    render(<CheckoutPage />);

    const applyButton = screen.getByRole("button", { name: "apply" });
    fireEvent.click(applyButton);

    expect(mockApplyPromotion).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("validation.required");
  });

  it("disables input and button during pending submission and blocks duplicate submit with rapid clicks", async () => {
    let resolvePromise: (cart: StoreCart) => void;
    const pendingPromise = new Promise<StoreCart>((resolve) => {
      resolvePromise = resolve;
    });

    mockApplyPromotion.mockReturnValue(pendingPromise);

    render(<CheckoutPage />);

    const promoInput = screen.getByPlaceholderText("placeholder");
    const applyButton = screen.getByRole("button", { name: "apply" });

    fireEvent.change(promoInput, { target: { value: "PROMO20" } });

    // Two rapid clicks before rerender or promise resolution
    fireEvent.click(applyButton);
    fireEvent.click(applyButton);

    expect(mockApplyPromotion).toHaveBeenCalledTimes(1);
    expect(mockApplyPromotion).toHaveBeenCalledWith("PROMO20");

    expect(promoInput).toBeDisabled();
    expect(applyButton).toBeDisabled();

    // Cleanup pending promise
    resolvePromise!({
      ...sampleCart,
      promotions: [{ id: "p1", code: "PROMO20" }],
    });
  });

  it("handles successful promotion acceptance: calls applyPromotion, updates cart, and displays applied code", async () => {
    const updatedCart: StoreCart = {
      ...sampleCart,
      discount_total: 1000,
      total: 4000,
      promotions: [{ id: "promo_1", code: "SAVE20" }],
    };
    mockApplyPromotion.mockImplementation(async () => {
      mockCart = updatedCart;
      return updatedCart;
    });

    const { rerender } = render(<CheckoutPage />);

    const promoInput = screen.getByPlaceholderText("placeholder");
    fireEvent.change(promoInput, { target: { value: "  SAVE20  " } });

    const applyButton = screen.getByRole("button", { name: "apply" });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockApplyPromotion).toHaveBeenCalledWith("SAVE20");
    });

    rerender(<CheckoutPage />);

    expect(screen.getByText("SAVE20")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("placeholder")).not.toBeInTheDocument();
  });

  it("handles promotion rejection: preserves prior cart and renders localized error feedback", async () => {
    mockApplyPromotion.mockRejectedValue(new Error("Invalid code"));

    render(<CheckoutPage />);

    const promoInput = screen.getByPlaceholderText("placeholder");
    fireEvent.change(promoInput, { target: { value: "INVALID" } });

    const applyButton = screen.getByRole("button", { name: "apply" });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockApplyPromotion).toHaveBeenCalledWith("INVALID");
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("errors.failed");
    expect(mockSetCart).not.toHaveBeenCalled();
  });

  it("displays existing applied promotion code and hides submission form if cart already has promotion", () => {
    mockCart = {
      ...sampleCart,
      promotions: [{ id: "p_existing", code: "WELCOME10" }],
      discount_total: 500,
      total: 4500,
    };

    render(<CheckoutPage />);

    expect(screen.getByText("WELCOME10")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("placeholder")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "apply" })).not.toBeInTheDocument();
  });

  it("ensures promotion form and actions are absent outside CheckoutAddress step", async () => {
    render(<CheckoutPage />);

    expect(screen.getByPlaceholderText("placeholder")).toBeInTheDocument();

    // Fill fields and advance to shipping step
    fireEvent.change(screen.getByRole("textbox", { name: /email/i }), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /firstName/i }), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /lastName/i }), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /address/i }), {
      target: { value: "Main St 1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: /city/i }), {
      target: { value: "Berlin" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /postalCode/i }), {
      target: { value: "10115" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: /phone/i }), {
      target: { value: "+491701234567" },
    });

    const continueBtn = screen.getByRole("button", { name: "continue" });
    fireEvent.click(continueBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "continueToPayment" })).toBeInTheDocument();
    });

    expect(screen.queryByPlaceholderText("placeholder")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "apply" })).not.toBeInTheDocument();
  });
});
