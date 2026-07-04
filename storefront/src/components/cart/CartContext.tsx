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
import { resolveRegion, type RegionResult } from "@/lib/medusa/regions";
import { useLocale } from "next-intl";
import { toMedusaLocale, type Locale } from "@/i18n/routing";
import {
  addLineItem,
  clearCartId,
  createCart,
  getCart,
  getStoredCartId,
  isCartNotFound,
  removeLineItem,
  updateCart,
  updateLineItem,
} from "@/lib/medusa/cart";
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
// Context
// ---------------------------------------------------------------------------

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<StoreCart | null>(null);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const regionRef = useRef<RegionResult | null>(null);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const locale = useLocale() as Locale;
  const medusaLocale = toMedusaLocale(locale);

  // ---- Initialise on mount: restore cart from storage ----
  useEffect(() => {
    const myId = ++requestIdRef.current;
    mountedRef.current = true;
    const isCurrent = () => mountedRef.current && requestIdRef.current === myId;

    if (!getStoredCartId()) {
      if (isCurrent()) {
        setCart(null);
        setLoading(false);
      }
      return;
    }

    (async () => {
      try {
        const restored = await getCart(medusaLocale);
        if (isCurrent()) {
          if (restored && medusaLocale) {
            const targetRegion = await resolveRegion(undefined, medusaLocale);
            if (
              !("type" in targetRegion) &&
              restored.region_id !== targetRegion.regionId
            ) {
              try {
                const synced = await updateCart(
                  restored.id,
                  { region_id: targetRegion.regionId },
                  medusaLocale,
                );
                if (isCurrent()) {
                  setCart(synced as unknown as StoreCart | null);
                }
              } catch (error) {
                // ponytail: fallback to un-synced cart on update failure
                if (isCurrent()) {
                  setCart(restored as unknown as StoreCart | null);
                }
              }
            } else {
              if (isCurrent()) {
                setCart(restored as unknown as StoreCart | null);
              }
            }
          } else {
            if (isCurrent()) {
              setCart(restored as unknown as StoreCart | null);
            }
          }
        }
      } catch (err) {
        if (isCurrent()) {
          setCart(null);
        }
      } finally {
        if (isCurrent()) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mountedRef.current = false;
    };
  }, [medusaLocale]);

  // ---- Resolve region once (lazily, on first mutation) ----
  const ensureRegion = useCallback(async (): Promise<RegionResult> => {
    if (regionRef.current) return regionRef.current;

    const resolved = await resolveRegion(undefined, medusaLocale);

    if ("type" in resolved) {
      throw new Error(
        `No Medusa region found for country "${resolved.countryCode}". ` +
          `Please configure a region in the Medusa admin.`,
      );
    }

    regionRef.current = resolved;
    return resolved;
  }, [medusaLocale]);

  // ---- Stale-cart recovery ----
  //
  // Runs `run` against `cartId`. When the SDK reports the cart as not found
  // (e.g. it was completed or expired server-side), the zombie id is cleared
  // and a fresh cart is created for the region. The operation is retried only
  // when `retry` is true — add works against any cart, but update/remove
  // target line items that no longer exist on a fresh cart, so recovery just
  // replaces the zombie projection with the empty cart.
  const runWithRecovery = useCallback(
    async <T,>(
      cartId: string,
      run: (id: string) => Promise<T>,
      retry: boolean,
    ): Promise<T> => {
      try {
        return await run(cartId);
      } catch (err) {
        if (!isCartNotFound(err)) throw err;
        clearCartId();
        const region = await ensureRegion();
        const fresh = (await createCart(region, medusaLocale)) as unknown as StoreCart;
        setCart(fresh);
        if (retry) return await run(fresh.id);
        return fresh as unknown as T;
      }
    },
    [ensureRegion],
  );

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
          const fresh = (await createCart(region, medusaLocale)) as unknown as StoreCart;
          currentId = fresh.id;
          setCart(fresh);
        }

        // Add the line item (recreating the cart if the stored id is stale).
        const updated = await runWithRecovery(
          currentId,
          async (id) =>
            (await addLineItem(id, variantId, quantity, metadata, medusaLocale)) as unknown as StoreCart,
          true,
        );
        setCart(updated);
        setIsOpen(true);
        return updated;
      } finally {
        setMutating(false);
      }
    },
    [cart, ensureRegion, runWithRecovery],
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

        const updated = await runWithRecovery(
          currentId,
          async (id): Promise<StoreCart> => {
            if (quantity <= 0) {
              let next = (await removeLineItem(id, lineItemId, medusaLocale)) as unknown as StoreCart;
              if (linkedItem) {
                next = (await removeLineItem(id, linkedItem.id, medusaLocale)) as unknown as StoreCart;
              }
              return next;
            }
            let next = (await updateLineItem(id, lineItemId, quantity, medusaLocale)) as unknown as StoreCart;
            if (linkedItem) {
              next = (await updateLineItem(id, linkedItem.id, quantity)) as unknown as StoreCart;
            }
            return next;
          },
          false,
        );
        setCart(updated);
      } catch {
        // Non-recoverable failure — leave the previous projection in place.
      } finally {
        setMutating(false);
      }
    },
    [cart, runWithRecovery],
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

        const updated = await runWithRecovery(
          currentId,
          async (id): Promise<StoreCart> => {
            let next = (await removeLineItem(id, lineItemId, medusaLocale)) as unknown as StoreCart;
            if (linkedItem) {
              next = (await removeLineItem(id, linkedItem.id, medusaLocale)) as unknown as StoreCart;
            }
            return next;
          },
          false,
        );
        setCart(updated);
      } catch {
        // Non-recoverable failure — leave the previous projection in place.
      } finally {
        setMutating(false);
      }
    },
    [cart, runWithRecovery],
  );

  // ---- Drawer controls ----

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const clearCart = useCallback(() => {
    clearCartId();
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
