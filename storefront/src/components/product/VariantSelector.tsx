"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import type {
  ProductOption,
  ProductVariant,
  StockInfo,
} from "./types";
import type { VariantSelectorLabels } from "./types";
import { PriceDisplay } from "./PriceDisplay";
import { useCart } from "@/components/cart/CartContext";
import {
  defaultVariantOptions,
  projectAvailability,
  resolveVariantByOptions,
} from "@/lib/price";
import { getBadgeCta } from "@/lib/badge-behavior";

export interface VariantSelectorProps {
  options: ProductOption[] | null | undefined;
  variants: ProductVariant[] | null | undefined;
  /** Marketing badge from product.metadata.badge. Controls CTA behavior. */
  badge?: string | null;
  /** When true, hides the option-picking UI (options are managed externally). */
  hideOptionButtons?: boolean;
  /** Localized labels for all UI copy. */
  labels: VariantSelectorLabels;
  /** The selected packaging variant ID if any. */
  selectedPackagingVariantId?: string | null;
  /** Callback invoked with resolved { productId?, variantId, quantity } when valid. */
  onSelectionChange?: (selection: {
    variantId: string | null;
    quantity: number;
    valid: boolean;
    selectedOptions?: Record<string, string>;
    onOptionChange?: (optionId: string, value: string) => void;
    /** The resolved variant, if any. */
    resolvedVariant?: ProductVariant | null;
    /** Derived stock/delivery info. */
    stockInfo?: StockInfo | null;
  }) => void;
}

/**
 * Derives selectable option values from variant data, filtering to only values
 * that appear on variants reachable given other current selections.
 */
function availableValues(
  options: ProductOption[],
  variants: ProductVariant[],
  selected: Record<string, string>,
  currentOptionId: string,
): string[] {
  const rawValues = options
    .find((o) => o.id === currentOptionId)
    ?.values?.map((v) => (typeof v === "string" ? v : v.value)) ?? [];

  if (rawValues.length === 0) return [];

  return rawValues.filter((val) => {
    return variants.some((v) => {
      const vOpts = v.options ?? [];
      const match = vOpts.find((o) => o.option_id === currentOptionId);
      if (!match || match.value !== val) return false;

      // Check that this variant is compatible with other current selections.
      for (const [optId, optVal] of Object.entries(selected)) {
        if (optId === currentOptionId) continue;
        const otherMatch = vOpts.find((o) => o.option_id === optId);
        if (!otherMatch || otherMatch.value !== optVal) return false;
      }
      return true;
    });
  });
}

/**
 * Derive stock/delivery messaging from a variant for display near CTA.
 */
function deriveStockInfo(
  variant: ProductVariant | null,
  labels: VariantSelectorLabels,
): StockInfo | null {
  if (!variant) return null;

  const { available, status } = projectAvailability(variant);

  const messageByStatus: Record<StockInfo["status"], string> = {
    inStock: labels.inStock,
    lowStock: labels.lowStock,
    backorderAvailable: labels.backorderAvailable,
    outOfStock: labels.notAvailable,
  };

  return {
    available,
    status,
    message: messageByStatus[status],
    deliveryPromise: available ? labels.deliveryPromise : null,
  };
}

export function VariantSelector({
  options,
  variants,
  badge,
  hideOptionButtons = false,
  labels,
  selectedPackagingVariantId = null,
  onSelectionChange,
}: VariantSelectorProps) {
  const safeOptions = useMemo(() => options ?? [], [options]);
  const safeVariants = useMemo(() => variants ?? [], [variants]);

  const [selected, setSelected] = useState<Record<string, string>>(() =>
    defaultVariantOptions(options, variants),
  );
  const [quantity, setQuantity] = useState(1);
  const [addingInProgress, setAddingInProgress] = useState(false);

  const { addItem } = useCart();

  const resolved = useMemo(
    () => resolveVariantByOptions(safeVariants, selected),
    [safeVariants, selected],
  );

  const stockInfo = useMemo(
    () => deriveStockInfo(resolved, labels),
    [resolved, labels],
  );

  const allOptionsSelected = safeOptions.every((o) => selected[o.id] != null);
  const quantityValid = Number.isInteger(quantity) && quantity > 0;

  const valid = allOptionsSelected && resolved != null && quantityValid;

  // Notify parent on changes.
  const stableCallback = useCallback(
    (s: typeof selected, q: number) => {
      const v = resolveVariantByOptions(safeVariants, s);
      const si = deriveStockInfo(v, labels);
      onSelectionChange?.({
        variantId: v?.id ?? null,
        quantity: q,
        valid:
          safeOptions.every((o) => s[o.id] != null) &&
          v != null &&
          Number.isInteger(q) &&
          q > 0,
        selectedOptions: s,
        onOptionChange: (optionId: string, value: string) => {
          setSelected((prev) => ({ ...prev, [optionId]: value }));
        },
        resolvedVariant: v ?? null,
        stockInfo: si,
      });
    },
    [safeOptions, safeVariants, onSelectionChange, labels],
  );

  // Notify parent of initial selection on mount.
  useEffect(() => {
    stableCallback(selected, quantity);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableCallback]);

  const handleOptionChange = useCallback(
    (optionId: string, value: string) => {
      setSelected((prev) => {
        const next = { ...prev, [optionId]: value };
        stableCallback(next, quantity);
        return next;
      });
    },
    [quantity, stableCallback],
  );

  const handleQuantityChange = useCallback(
    (next: number) => {
      const q = Math.max(0, next);
      setQuantity(q);
      stableCallback(selected, q);
    },
    [selected, stableCallback],
  );
  const availability = resolved ? projectAvailability(resolved) : null;
  const baseAvailable = availability?.available ?? false;
  const badgeCta = getBadgeCta(badge, baseAvailable);
  const cartReady = valid && badgeCta.enabled;

  const buttonCopy = (() => {
    if (!allOptionsSelected) return labels.selectAllOptions;
    if (!resolved) return labels.unavailable;
    if (badgeCta.state === "disabled") return labels.outOfStock;
    if (badgeCta.state === "pre_order") return labels.preOrder;
    if (!quantityValid) return labels.invalidQuantity;
    return labels.addToCart;
  })();

  const handleAddToCart = async () => {
    if (!resolved?.id || !cartReady || addingInProgress) return;
    setAddingInProgress(true);
    try {
      const updatedCart = await addItem(resolved.id, quantity, {
        calculated_price: resolved.calculated_price
          ? {
              calculated_amount: resolved.calculated_price.calculated_amount,
              original_amount: resolved.calculated_price.original_amount,
              currency_code: resolved.calculated_price.currency_code,
            }
          : null,
      });
      if (selectedPackagingVariantId && updatedCart) {
        // Find the main line item we just added/updated.
        const mainLineItem = updatedCart.items?.find(
          (item) =>
            item.variant_id === resolved.id &&
            !item.metadata?.parent_line_item_id,
        );
        if (mainLineItem) {
          await addItem(selectedPackagingVariantId, quantity, {
            parent_line_item_id: mainLineItem.id,
          });
        }
      }
    } catch {
      // Error is handled by the context; button stays enabled for retry.
    } finally {
      setAddingInProgress(false);
    }
  };

  const showOptions = !hideOptionButtons && safeVariants.length > 1;

  return (
    <div className="flex flex-col gap-5">
      {/* Options */}
      {showOptions &&
        safeOptions.map((opt) => {
          const values = availableValues(
            safeOptions,
            safeVariants,
            selected,
            opt.id,
          );
          const showLegend =
            opt.title.toLowerCase() !== "material" && safeOptions.length > 1;
          return (
            <fieldset key={opt.id} className="flex flex-col gap-2">
              {showLegend && (
                <legend className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/70">
                  {opt.title}
                </legend>
              )}
              <div className="flex flex-wrap gap-2">
                {values.map((val) => {
                  const isSelected = selected[opt.id] === val;
                  const displayVal = labels.materialNames[val] || val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleOptionChange(opt.id, val)}
                      className={[
                        "px-4 py-2 text-sm font-medium tracking-wide uppercase border transition-all duration-200 cursor-pointer",
                        isSelected
                          ? "border-[#2f6f78] bg-[#2f6f78] text-white"
                          : "border-[#2c211b]/20 text-[#2c211b] hover:border-[#2c211b]/50",
                      ].join(" ")}
                    >
                      {displayVal}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

      {/* Stock + delivery messaging & Price */}
      {stockInfo && (
        <div className={["flex items-center justify-between", showOptions ? "border-t border-[#2c211b]/10 pt-4" : ""].join(" ")}>
          <div className="flex flex-col gap-1">
            <p
              className={[
                "text-xs font-medium uppercase tracking-wider",
                stockInfo.available ? "text-[#2f6f78]" : "text-red-600",
              ].join(" ")}
            >
              {stockInfo.message}
            </p>
            {stockInfo.deliveryPromise && stockInfo.available && (
              <p className="text-xs text-[#2c211b]/50">
                {stockInfo.deliveryPromise}
              </p>
            )}
          </div>
          {resolved?.calculated_price && (
            <div className="flex items-baseline gap-2">
              <PriceDisplay
                price={resolved.calculated_price}
                className="text-xl sm:text-2xl font-light font-serif text-[#2c211b]"
              />
            </div>
          )}
        </div>
      )}

      {/* Quantity & CTA */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="variant-qty"
          className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/70"
        >
          {labels.quantity}
        </label>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity <= 1}
              className="w-9 h-9 flex items-center justify-center border border-[#2c211b]/20 text-[#2c211b] hover:border-[#2c211b]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label={labels.decreaseQuantity}
            >
              −
            </button>
            <input
              id="variant-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v)) handleQuantityChange(v);
              }}
              className="w-16 h-9 text-center text-[16px] border border-[#2c211b]/20 text-[#2c211b] bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => handleQuantityChange(quantity + 1)}
              className="w-9 h-9 flex items-center justify-center border border-[#2c211b]/20 text-[#2c211b] hover:border-[#2c211b]/50 transition-colors"
              aria-label={labels.increaseQuantity}
            >
              +
            </button>
          </div>

          <button
            id="pdp-primary-cta"
            type="button"
            disabled={!cartReady || addingInProgress}
            aria-disabled={(!cartReady || addingInProgress) ? "true" : undefined}
            onClick={handleAddToCart}
            className={[
              "flex-1 h-9 inline-flex items-center justify-center px-6 text-xs font-medium tracking-widest uppercase transition-all duration-300",
              cartReady && !addingInProgress
                ? "bg-[#2c211b] text-[#f4ebe6] hover:bg-[#2c211b]/90 cursor-pointer"
                : "bg-[#2c211b]/10 text-[#2c211b]/30 cursor-not-allowed",
            ].join(" ")}
          >
            {addingInProgress ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {labels.adding}
              </span>
            ) : (
              buttonCopy
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
