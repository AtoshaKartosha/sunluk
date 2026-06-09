"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getMedusaClient } from "@/lib/medusa";
import { resolveRegion, type RegionResult } from "@/lib/medusa/regions";
import type { StoreCart } from "./types";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface CartContextType {
  cart: StoreCart | null;
  loading: boolean;
  mutating: boolean;
  isOpen: boolean;
  itemCount: number;
  addItem: (
    variantId: string,
    quantity: number,
    metadata?: Record<string, unknown>,
  ) => Promise<StoreCart | undefined>;
  updateItem: (lineItemId: string, quantity: number) => Promise<void>;
  removeItem: (lineItemId: string) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  clearCart: () => void;
  setCart: React.Dispatch<React.SetStateAction<StoreCart | null>>;
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const CART_ID_KEY = "sunluk_cart_id";

function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

function storeCartId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_ID_KEY, id);
  } catch {
    // Storage full or unavailable — non-critical for cart.
  }
}

function clearStoredCartId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CART_ID_KEY);
    localStorage.removeItem("medusa_cart_id");
  } catch {
    // No-op.
  }
}

// ---------------------------------------------------------------------------
// API helpers (thin wrappers around the SDK, until lib/medusa/cart.ts lands)
// ---------------------------------------------------------------------------

const CART_FIELDS =
  "id,region_id,customer_id,email,sales_channel_id,currency_code,total,subtotal,tax_total,discount_total,shipping_total,item_total,item_subtotal,item_tax_total,item_count,*items,*items.variant,*items.product,*region,*shipping_address,*billing_address,*shipping_methods";

async function fetchCart(cartId: string): Promise<StoreCart> {
  const sdk = getMedusaClient();
  const result = (await sdk.store.cart.retrieve(cartId, {
    fields: CART_FIELDS,
  })) as unknown as { cart: StoreCart };
  return result.cart;
}

async function createMedusaCart(region: RegionResult): Promise<StoreCart> {
  const sdk = getMedusaClient();
  const result = (await sdk.store.cart.create(
    {
      region_id: region.regionId,
      currency_code: region.currencyCode,
    },
    { fields: CART_FIELDS },
  )) as unknown as { cart: StoreCart };
  return result.cart;
}

async function addCartLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
  metadata?: Record<string, unknown>,
): Promise<StoreCart> {
  const sdk = getMedusaClient();
  const result = (await sdk.store.cart.createLineItem(
    cartId,
    { variant_id: variantId, quantity, metadata },
    { fields: CART_FIELDS },
  )) as unknown as { cart: StoreCart };
  return result.cart;
}

async function updateCartLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number,
): Promise<StoreCart> {
  const sdk = getMedusaClient();
  const result = (await sdk.store.cart.updateLineItem(
    cartId,
    lineItemId,
    { quantity },
    { fields: CART_FIELDS },
  )) as unknown as { cart: StoreCart };
  return result.cart;
}

async function deleteCartLineItem(
  cartId: string,
  lineItemId: string,
): Promise<StoreCart> {
  const sdk = getMedusaClient();
  // deleteLineItem returns a different shape; fetch the full cart afterward
  // to keep the response shape consistent.
  await sdk.store.cart.deleteLineItem(cartId, lineItemId);
  return fetchCart(cartId);
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [loading, setLoading] = useState(() => {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem(CART_ID_KEY);
    }
    return false;
  });
  const [mutating, setMutating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const regionRef = useRef<RegionResult | null>(null);
  const mountedRef = useRef(true);

  // ---- Initialise on mount: restore cart from storage ----
  useEffect(() => {
    mountedRef.current = true;
    const cartId = getStoredCartId();

    if (!cartId) {
      return;
    }

    (async () => {
      try {
        const restored = await fetchCart(cartId);
        if (mountedRef.current) {
          setCart(restored);
        }
      } catch {
        // Cart may be completed, deleted, or expired — clear the stale id.
        clearStoredCartId();
        if (mountedRef.current) {
          setCart(null);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ---- Resolve region once (lazily, on first mutation) ----
  const ensureRegion = useCallback(async (): Promise<RegionResult> => {
    if (regionRef.current) return regionRef.current;

    const resolved = await resolveRegion();

    if ("type" in resolved) {
      throw new Error(
        `No Medusa region found for country "${resolved.countryCode}". ` +
          `Please configure a region in the Medusa admin.`,
      );
    }

    regionRef.current = resolved;
    return resolved;
  }, []);

  // ---- Derived ----

  const itemCount = useMemo(
    () =>
      cart?.items
        ?.filter((item) => !item.metadata?.parent_line_item_id)
        .reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    [cart],
  );

  // ---- Mutations ----

  const addItem = useCallback(
    async (
      variantId: string,
      quantity: number,
      metadata?: Record<string, unknown>,
    ) => {
      setMutating(true);
      try {
        const region = await ensureRegion();
        let currentId = cart?.id ?? getStoredCartId();

        // Create a new cart if one doesn't exist.
        if (!currentId) {
          const newCart = await createMedusaCart(region);
          currentId = newCart.id;
          storeCartId(currentId);
          setCart(newCart);
        }

        // Add the line item.
        const updated = await addCartLineItem(
          currentId,
          variantId,
          quantity,
          metadata,
        );
        setCart(updated);
        setIsOpen(true);
        return updated;
      } catch (err) {
        // Mutations that fail leave the previous cart projection in place
        // so the user can retry. A production app would surface the error.
        throw err;
      } finally {
        setMutating(false);
      }
    },
    [cart, ensureRegion],
  );

  const updateItem = useCallback(
    async (lineItemId: string, quantity: number) => {
      const currentId = cart?.id;
      if (!currentId) return;

      setMutating(true);
      try {
        const linkedItem = cart?.items?.find(
          (item) => item.metadata?.parent_line_item_id === lineItemId,
        );

        if (quantity <= 0) {
          let updated = await deleteCartLineItem(currentId, lineItemId);
          if (linkedItem) {
            updated = await deleteCartLineItem(currentId, linkedItem.id);
          }
          setCart(updated);
        } else {
          let updated = await updateCartLineItem(
            currentId,
            lineItemId,
            quantity,
          );
          if (linkedItem) {
            updated = await updateCartLineItem(
              currentId,
              linkedItem.id,
              quantity,
            );
          }
          setCart(updated);
        }
      } catch {
        // Leave previous projection in place.
      } finally {
        setMutating(false);
      }
    },
    [cart],
  );

  const removeItem = useCallback(
    async (lineItemId: string) => {
      const currentId = cart?.id;
      if (!currentId) return;

      setMutating(true);
      try {
        const linkedItem = cart?.items?.find(
          (item) => item.metadata?.parent_line_item_id === lineItemId,
        );

        let updated = await deleteCartLineItem(currentId, lineItemId);
        if (linkedItem) {
          updated = await deleteCartLineItem(currentId, linkedItem.id);
        }
        setCart(updated);
      } catch {
        // Leave previous projection in place.
      } finally {
        setMutating(false);
      }
    },
    [cart],
  );

  // ---- Drawer controls ----

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const clearCart = useCallback(() => {
    clearStoredCartId();
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("sunluk_cart_id");
        localStorage.removeItem("medusa_cart_id");
      } catch {
        // No-op.
      }
    }
    setCart(null);
  }, []);

  // ---- Value ----

  const value = useMemo<CartContextType>(
    () => ({
      cart,
      loading,
      mutating,
      isOpen,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      openCart,
      closeCart,
      clearCart,
      setCart,
    }),
    [
      cart,
      loading,
      mutating,
      isOpen,
      itemCount,
      addItem,
      updateItem,
      removeItem,
      openCart,
      closeCart,
      clearCart,
      setCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a <CartProvider>");
  }
  return ctx;
}
