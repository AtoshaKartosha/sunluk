import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { VariantSelector } from "../../components/product/VariantSelector";
import CartDrawer from "../../components/cart/CartDrawer";
import type { StoreCart, StoreCartLineItem } from "../../components/cart/types";

// Mock the cart context hook
const mockAddItem = vi.fn();
const mockUpdateItem = vi.fn();
const mockRemoveItem = vi.fn();
const mockCloseCart = vi.fn();
let mockMutating = false;

let activeCart: StoreCart | null = null;

vi.mock("../../components/cart/CartContext", () => ({
  useCart: () => ({
    cart: activeCart,
    loading: false,
    mutating: mockMutating,
    isOpen: true,
    itemCount: activeCart?.items?.length ?? 0,
    addItem: mockAddItem,
    updateItem: mockUpdateItem,
    removeItem: mockRemoveItem,
    openCart: vi.fn(),
    closeCart: mockCloseCart,
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
    mockMutating = false;
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

  it("omits packaging_variant_id when no packaging is selected", async () => {
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
      <VariantSelector options={[]} variants={[mockVariant]} labels={mockLabels} />
    );

    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));

    await waitFor(() => expect(mockAddItem).toHaveBeenCalledTimes(1));
    const [, , metadata] = mockAddItem.mock.calls[0];
    expect(metadata).not.toHaveProperty("packaging_variant_id");
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

  it("skips packaging and re-enables retry when the returned cart has no matching main item", async () => {
    mockAddItem.mockResolvedValue({
      id: "cart_123",
      items: [
        {
          id: "item_other_123",
          variant_id: "var_123",
          metadata: { packaging_variant_id: "other_package" },
        },
      ],
    });

    render(
      <VariantSelector
        options={[]}
        variants={[{
          id: "var_123",
          manage_inventory: false,
          options: [],
          calculated_price: { calculated_amount: 1000, currency_code: "rub" },
        }]}
        labels={mockLabels}
        selectedPackagingVariantId="pkg_box_123"
      />,
    );

    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);

    await waitFor(() => expect(mockAddItem).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(button).not.toBeDisabled());
    expect(mockAddItem).toHaveBeenLastCalledWith("var_123", 1, expect.any(Object));
    expect(mockAddItem).not.toHaveBeenCalledWith("pkg_box_123", 1, expect.any(Object));

    fireEvent.click(button);
    await waitFor(() => expect(mockAddItem).toHaveBeenCalledTimes(2));
    expect(mockAddItem).toHaveBeenLastCalledWith("var_123", 1, expect.any(Object));
  });

  it("re-enables retry after packaging fails while retaining the accepted main cart", async () => {
    const mainCart = {
      id: "cart_123",
      currency_code: "rub",
      subtotal: 1000,
      total: 1000,
      items: [
        {
          id: "item_main_123",
          title: "Accepted main product",
          variant_id: "var_123",
          quantity: 1,
          unit_price: 1000,
          metadata: { packaging_variant_id: "pkg_box_123" },
        },
      ],
    } as unknown as StoreCart;
    mockAddItem.mockImplementation((variantId: string) => {
      if (variantId === "var_123") {
        activeCart = mainCart;
        return Promise.resolve(mainCart);
      }
      return Promise.reject(new Error("packaging unavailable"));
    });

    const selector = (
      <VariantSelector
        options={[]}
        variants={[{
          id: "var_123",
          manage_inventory: false,
          options: [],
          calculated_price: { calculated_amount: 1000, currency_code: "rub" },
        }]}
        labels={mockLabels}
        selectedPackagingVariantId="pkg_box_123"
      />
    );
    const view = render(
      <>
        {selector}
        <CartDrawer />
      </>,
    );

    const button = screen.getByRole("button", { name: /add to cart/i });
    fireEvent.click(button);

    await waitFor(() => expect(mockAddItem).toHaveBeenCalledTimes(2));
    await expect(mockAddItem.mock.results[0]?.value).resolves.toBe(mainCart);
    await expect(mockAddItem.mock.results[1]?.value).rejects.toThrow("packaging unavailable");
    await waitFor(() => expect(button).not.toBeDisabled());
    view.rerender(
      <>
        {selector}
        <CartDrawer />
      </>,
    );
    expect(screen.getByText("Accepted main product")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);

    fireEvent.click(button);
    await waitFor(() => expect(mockAddItem).toHaveBeenCalledTimes(4));
    expect(mockAddItem).toHaveBeenNthCalledWith(3, "var_123", 1, expect.any(Object));
    expect(mockAddItem).toHaveBeenNthCalledWith(4, "pkg_box_123", 1, {
      parent_line_item_id: "item_main_123",
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

  it("renders multiple packaging items under a single parent, and rowTotal correctly sums all of them", () => {
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
          id: "item_pkg_1",
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
        {
          id: "item_pkg_2",
          title: "Cotton Pouch (Turquoise)",
          unit_price: 200,
          quantity: 2,
          metadata: {
            parent_line_item_id: "item_main_123",
          },
          product: {
            title: "Cotton Pouch (Turquoise)",
            handle: "cotton-pouch-turquoise",
          },
        },
      ] as unknown as StoreCartLineItem[],
    } as unknown as StoreCart;

    render(<CartDrawer />);

    // Row total: (9000 + 500 + 200) * 2 = 19400
    // Product-only total: 9000 * 2 = 18000
    // Packaging 1: 500 * 2 = 1000
    // Packaging 2: 200 * 2 = 400

    const mainTotalText = screen.getByText(/18\s*000\s*(₽|руб)/i);
    expect(mainTotalText).toBeInTheDocument();

    const pkg1TotalText = screen.getByText(/\+\s*1\s*000\s*(₽|руб)/i);
    expect(pkg1TotalText).toBeInTheDocument();

    const pkg2TotalText = screen.getByText(/\+\s*400\s*(₽|руб)/i);
    expect(pkg2TotalText).toBeInTheDocument();

    const rowTotalText = screen.getByText(/19\s*400\s*(₽|руб)/i);
    expect(rowTotalText).toBeInTheDocument();
  });

  it("surfaces orphaned packaging items as main items in the Cart Drawer", () => {
    activeCart = {
      id: "cart_123",
      currency_code: "rub",
      items: [
        {
          id: "item_pkg_orphan",
          title: "Premium Gift Box",
          unit_price: 500,
          quantity: 2,
          metadata: {
            parent_line_item_id: "item_nonexistent",
          },
          product: {
            title: "Premium Gift Box",
            handle: "gift-box",
          },
        },
      ] as unknown as StoreCartLineItem[],
    } as unknown as StoreCart;

    render(<CartDrawer />);

    // Orphaned item should be rendered as a main line item!
    // Since unit price is 500 and quantity is 2:
    // It should render:
    // - Title: "Premium Gift Box"
    // - Under title (product-only total): 500 * 2 = 1000
    // - On the right (combined total): 500 * 2 = 1000
    const titleText = screen.getByText("Premium Gift Box");
    expect(titleText).toBeInTheDocument();

    const productTotalTexts = screen.getAllByText(/1\s*000\s*(₽|руб)/i);
    expect(productTotalTexts.length).toBe(2);
  });
});

describe("CartDrawer continue shopping action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutating = true;
    activeCart = {
      id: "cart_123",
      currency_code: "rub",
      items: [
        {
          id: "item_main_123",
          title: "Main Product",
          unit_price: 9000,
          quantity: 1,
        },
      ] as unknown as StoreCartLineItem[],
    } as unknown as StoreCart;
  });

  it("links to the locale catalog and closes without being disabled by a cart mutation", () => {
    render(<CartDrawer />);

    const continueShopping = screen.getByRole("link", { name: "continueShopping" });
    expect(continueShopping).toHaveAttribute("href", "/ru/products");
    expect(continueShopping).not.toHaveClass("pointer-events-none");

    fireEvent.click(continueShopping);
    expect(mockCloseCart).toHaveBeenCalledOnce();
  });
});
