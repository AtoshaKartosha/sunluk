"use client";

import { useState, useMemo, useCallback } from "react";
import type { ProductOption, ProductVariant } from "./types";
import { PriceDisplay } from "./PriceDisplay";

interface VariantSelectorProps {
  options: ProductOption[] | null | undefined;
  variants: ProductVariant[] | null | undefined;
  /** Callback invoked with resolved { productId?, variantId, quantity } when valid. Not wired to cart yet. */
  onSelectionChange?: (selection: {
    variantId: string | null;
    quantity: number;
    valid: boolean;
  }) => void;
}

/**
 * Finds the variant whose option values exactly match the selected map.
 */
function resolveVariant(
  variants: ProductVariant[],
  selected: Record<string, string>,
): ProductVariant | null {
  if (variants.length === 1 && Object.keys(selected).length === 0) {
    const onlyVariant = variants[0];
    return onlyVariant.options == null || onlyVariant.options.length === 0
      ? onlyVariant
      : null;
  }

  return (
    variants.find((v) => {
      const vOpts = v.options;
      if (!vOpts || vOpts.length === 0) return false;
      if (vOpts.length !== Object.keys(selected).length) return false;
      return vOpts.every((vo) => selected[vo.option_id] === vo.value);
    }) ?? null
  );
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
  // Collect raw option values from the product option definition.
  const raw = (options.find((o) => o.id === currentOptionId)?.values ?? []).map((value) =>
    typeof value === "string" ? value : value.value,
  );

  // Filter to values that exist on at least one variant compatible with other selections.
  const filtered = raw.filter((val) =>
    variants.some((v) => {
      const vOpts = v.options;
      if (!vOpts) return false;
      return vOpts.every((vo) => {
        if (vo.option_id === currentOptionId) return vo.value === val;
        const sel = selected[vo.option_id];
        return sel == null || sel === vo.value;
      });
    }),
  );

  return filtered.length > 0 ? filtered : raw;
}

export function VariantSelector({
  options,
  variants,
  onSelectionChange,
}: VariantSelectorProps) {
  const safeOptions = useMemo(() => options ?? [], [options]);
  const safeVariants = useMemo(() => variants ?? [], [variants]);

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  const resolved = useMemo(
    () => resolveVariant(safeVariants, selected),
    [safeVariants, selected],
  );

  const allOptionsSelected = safeOptions.every((o) => selected[o.id] != null);
  const quantityValid = Number.isInteger(quantity) && quantity > 0;

  const valid = allOptionsSelected && resolved != null && quantityValid;

  // Notify parent on changes.
  const stableCallback = useCallback(
    (s: typeof selected, q: number) => {
      const v = resolveVariant(safeVariants, s);
      onSelectionChange?.({
        variantId: v?.id ?? null,
        quantity: q,
        valid:
          safeOptions.every((o) => s[o.id] != null) &&
          v != null &&
          Number.isInteger(q) &&
          q > 0,
      });
    },
    [safeOptions, safeVariants, onSelectionChange],
  );

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

  const isInStock = resolved
    ? resolved.manage_inventory === false || (resolved.inventory_quantity ?? 0) > 0
    : null;

  const buttonCopy = (() => {
    if (!allOptionsSelected) return "Выберите все параметры";
    if (!resolved) return "Недоступно";
    if (isInStock === false) return "Нет в наличии";
    if (!quantityValid) return "Укажите количество";
    return "Корзина скоро";
  })();

  const cartReady = valid && isInStock !== false;

  return (
    <div className="flex flex-col gap-5">
      {/* Options */}
      {safeOptions.map((opt) => {
        const values = availableValues(
          safeOptions,
          safeVariants,
          selected,
          opt.id,
        );
        return (
          <fieldset key={opt.id} className="flex flex-col gap-2">
            <legend className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/70">
              {opt.title}
            </legend>
            <div className="flex flex-wrap gap-2">
              {values.map((val) => {
                const isSelected = selected[opt.id] === val;
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
                    {val}
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {/* Variant price */}
      {resolved?.calculated_price && (
        <div className="flex items-center gap-2 pt-2 border-t border-[#2c211b]/10">
          <span className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/60">
            Цена
          </span>
          <PriceDisplay price={resolved.calculated_price} />
        </div>
      )}

      {/* Stock note */}
      {resolved && (
        <p
          className={[
            "text-xs font-medium",
            isInStock ? "text-[#2f6f78]" : "text-red-600",
          ].join(" ")}
        >
          {isInStock
            ? "В наличии"
            : "Нет в наличии"}
        </p>
      )}

      {/* Quantity */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor="variant-qty"
          className="text-xs font-medium tracking-widest uppercase text-[#2c211b]/70"
        >
          Количество
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleQuantityChange(quantity - 1)}
            disabled={quantity <= 1}
            className="w-9 h-9 flex items-center justify-center border border-[#2c211b]/20 text-[#2c211b] hover:border-[#2c211b]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="Уменьшить количество"
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
            className="w-16 h-9 text-center text-sm border border-[#2c211b]/20 text-[#2c211b] bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            type="button"
            onClick={() => handleQuantityChange(quantity + 1)}
            className="w-9 h-9 flex items-center justify-center border border-[#2c211b]/20 text-[#2c211b] hover:border-[#2c211b]/50 transition-colors"
            aria-label="Увеличить количество"
          >
            +
          </button>
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={cartReady ? "Добавление в корзину будет подключено в следующем шаге" : undefined}
        className={[
          "inline-flex items-center justify-center px-10 py-4 text-xs font-medium tracking-widest uppercase transition-all duration-300",
          "bg-[#2c211b]/10 text-[#2c211b]/30 cursor-not-allowed",
        ].join(" ")}
      >
        {buttonCopy}
      </button>
    </div>
  );
}
