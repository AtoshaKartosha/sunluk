import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VariantSelector } from "../../components/product/VariantSelector";
import CartDrawer from "../../components/cart/CartDrawer";
import type { StoreCart, StoreCartLineItem } from "../../components/cart/types";

// Mock the cart context hook
const mockAddItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockRemoveItem = vi.fn();

let activeCart: StoreCart | null = null;

vi.mock("../../components/cart/CartContext", () => ({
  useCart: () => ({
    cart: activeCart,
    loading: false,
    mutating: false,
    isOpen: true,
    itemCount: activeCart?.items?.length ?? 0,
    addItem: mockAddItem,
    updateItem: mockUpdateItem,
    removeItem: mockRemoveItem,
    openCart: vi.fn(),
    closeCart: vi.fn(),
    clearCart: vi.fn(),
    setCart: vi.fn(),
  }),
}));

const mockLabels = {
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

describe("VariantSelector Packaging Metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    activeCart = null;
  });

  it("correctly includes packaging_variant_id in metadata when adding item to cart", async () => {
    mockAddItem.mockImplementation((variantId: string) => {
      if (variantId === "var_123") {
        return Promise.resolve({
          id: "cart_123",
          items: [
            {
              id: "item_main_123",
              variant_id: "var_123",
              quantity: 1,
              metadata: {
                packaging_variant_id: "pkg_box_123",
              },
            },
          ],
        });
      }
      return Promise.resolve({ id: "cart_123", items: [] });
    });

    const mockVariant = {
      id: "var_123",
      title: "Test Variant",
      manage_inventory: false,
      inventory_quantity: 10,
      allow_backorder: true,
      prices: [],
      options: [],
      calculated_price: {
        calculated_amount: 1000,
        original_amount: 1000,
        currency_code: "rub",
      },
    };

    render(
      <VariantSelector
        options={[]}
        variants={[mockVariant]}
        labels={mockLabels}
        selectedPackagingVariantId="pkg_box_123"
      />
    );

    const button = screen.getByRole("button", { name: /add to cart/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    await fireEvent.click(button);

    // Verify main product is added with packaging_variant_id in metadata
    expect(mockAddItem).toHaveBeenCalledWith("var_123", 1, {
      calculated_price: {
        calculated_amount: 1000,
        original_amount: 1000,
        currency_code: "rub",
      },
      packaging_variant_id: "pkg_box_123",
    });

    // Verify packaging is also added, linked to the main item
    expect(mockAddItem).toHaveBeenCalledWith("pkg_box_123", 1, {
      parent_line_item_id: "item_main_123",
    });
  });

  it("does not merge different packaging items and links to the correct parent variant", async () => {
    mockAddItem.mockImplementation((variantId: string) => {
      if (variantId === "var_123") {
        return Promise.resolve({
          id: "cart_123",
          items: [
            {
              id: "item_main_pouch",
              variant_id: "var_123",
              quantity: 1,
              metadata: {
                packaging_variant_id: "pkg_pouch_123",
              },
            },
            {
              id: "item_main_box",
              variant_id: "var_123",
              quantity: 1,
              metadata: {
                packaging_variant_id: "pkg_box_123",
              },
            },
          ],
        });
      }
      return Promise.resolve({ id: "cart_123", items: [] });
    });

    const mockVariant = {
      id: "var_123",
      title: "Test Variant",
      manage_inventory: false,
      inventory_quantity: 10,
      allow_backorder: true,
      prices: [],
      options: [],
      calculated_price: {
        calculated_amount: 1000,
        original_amount: 1000,
        currency_code: "rub",
      },
    };

    render(
      <VariantSelector
        options={[]}
        variants={[mockVariant]}
        labels={mockLabels}
        selectedPackagingVariantId="pkg_box_123"
      />
    );

    const button = screen.getByRole("button", { name: /add to cart/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    await fireEvent.click(button);

    // Verify main product is added with packaging_variant_id: pkg_box_123 in metadata
    expect(mockAddItem).toHaveBeenCalledWith("var_123", 1, {
      calculated_price: {
        calculated_amount: 1000,
        original_amount: 1000,
        currency_code: "rub",
      },
      packaging_variant_id: "pkg_box_123",
    });

    // Verify packaging is added, linked to item_main_box (which has matching packaging_variant_id), NOT item_main_pouch
    expect(mockAddItem).toHaveBeenCalledWith("pkg_box_123", 1, {
      parent_line_item_id: "item_main_box",
    });
  });
});

describe("CartDrawer Packaging Row Display", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scales row prices by quantity and displays combined row total on the right", () => {
    activeCart = {
      id: "cart_123",
      currency_code: "rub",
      items: [
        {
          id: "item_main_123",
          title: "Main Product",
          thumbnail: "thumb.jpg",
          unit_price: 9000,
          quantity: 2,
          metadata: {
            packaging_variant_id: "pkg_box_123",
            calculated_price: {
              calculated_amount: 9000,
              original_amount: 9000,
              currency_code: "rub",
            },
          },
          product: {
            title: "Main Product",
          },
        },
        {
          id: "item_pkg_123",
          title: "Premium Gift Box",
          unit_price: 500,
          quantity: 2,
          metadata: {
            parent_line_item_id: "item_main_123",
          },
          product: {
            title: "Premium Gift Box",
            handle: "gift-box",
          },
        },
      ] as unknown as StoreCartLineItem[],
    } as unknown as StoreCart;

    render(<CartDrawer />);

    // Row total: (9000 + 500) * 2 = 19000
    // Product-only total: 9000 * 2 = 18000
    // Packaging-only total: 500 * 2 = 1000

    // Since locale is "ru", formatPrice uses new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount)
    // The output formatting is: "19 000 ₽" or similar depending on Intl output (usually narrow non-breaking space).
    // Let's assert that the formatted amounts exist in the document:
    const mainTotalText = screen.getByText(/18\s*000\s*(₽|руб)/i);
    expect(mainTotalText).toBeInTheDocument();

    const pkgTotalText = screen.getByText(/\+\s*1\s*000\s*(₽|руб)/i);
    expect(pkgTotalText).toBeInTheDocument();

    const rowTotalText = screen.getByText(/19\s*000\s*(₽|руб)/i);
    expect(rowTotalText).toBeInTheDocument();
  });
});
