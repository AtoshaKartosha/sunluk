// ---- Types ----

export interface PriceParts {
  /** Integer part of the formatted price (e.g. "10"). */
  whole: string;
  /** Fractional part (e.g. "00"). Always 2 digits. */
  decimal: string;
  /** Uppercase currency code (e.g. "DKK"). */
  currency: string;
}

/** Minimal price shape shared across data and component layers. */
export interface PriceView {
  calculated_amount: number;
  currency_code: string;
}

/** Minimal variant shape needed for variant resolution and projection.
 *  Satisfied by both ProductDetailVariant (server) and ProductVariant (client). */
export interface ResolvableVariant {
  id: string;
  options?: ReadonlyArray<{ option_id: string; value: string }> | null;
  calculated_price?: PriceView | null;
  manage_inventory?: boolean | null;
  allow_backorder?: boolean | null;
  inventory_quantity?: number | null;
}

/** Single-source-of-truth projection for a resolved/selected variant. */
export interface VariantProjection {
  variantId: string | null;
  price: PriceView | null;
  isAvailable: boolean;
  inventoryQuantity: number | null;
  allowBackorder: boolean;
  selectedOptions: Record<string, string>;
}

// ---- Variant resolution ----

/**
 * Finds the variant whose option values exactly match the selected map.
 *
 * When there is exactly one variant with no options, it is returned
 * regardless of the selected map.  Otherwise every option key in
 * `selected` must match a variant option.
 */
export function resolveVariantByOptions<V extends ResolvableVariant>(
  variants: V[] | null | undefined,
  selected: Record<string, string>,
): V | null {
  const vars = variants ?? [];
  if (vars.length === 0) return null;

  if (vars.length === 1 && Object.keys(selected).length === 0) {
    const only = vars[0];
    return only.options == null || only.options.length === 0 ? only : null;
  }

  return (
    vars.find((v) => {
      const vOpts = v.options;
      if (!vOpts || vOpts.length === 0) return false;
      if (vOpts.length !== Object.keys(selected).length) return false;
      return vOpts.every((vo) => selected[vo.option_id] === vo.value);
    }) ?? null
  );
}

/**
 * Derive the default option selections from product options and variants,
 * preferring in-stock values.  Returns an empty map when no auto-selection
 * is possible.
 */
export function defaultVariantOptions(
  options:
    | ReadonlyArray<{
        id: string;
        values?: ReadonlyArray<string | { value: string }> | null;
      }>
    | null
    | undefined,
  variants: ResolvableVariant[] | null | undefined,
): Record<string, string> {
  const opts = options ?? [];
  const vars = variants ?? [];
  const initial: Record<string, string> = {};

  for (const opt of opts) {
    const optionValues = (opt.values ?? []).map((v) =>
      typeof v === "string" ? v : v.value,
    );
    if (optionValues.length === 0) continue;

    const inStockValues = optionValues.filter((val) =>
      vars.some((v) => {
        const matched = v.options?.find((o) => o.option_id === opt.id);
        if (!matched) return false;
        const inStock =
          v.manage_inventory === false || (v.inventory_quantity ?? 0) > 0;
        return matched.value === val && inStock;
      }),
    );

    if (inStockValues.length === 1) {
      initial[opt.id] = inStockValues[0];
    } else if (optionValues.length > 0) {
      initial[opt.id] =
        inStockValues.length > 0 ? inStockValues[0] : optionValues[0];
    }
  }

  return initial;
}

// ---- Projection ----

/**
 * Build a VariantProjection from variants and an optional pre-selected
 * options map.  When selectedOptions is omitted, auto-selects defaults.
 * This is the single source of truth for variant-driven price, stock,
 * and delivery data across PDP server and client paths.
 */
export function projectVariant<V extends ResolvableVariant>(
  variants: V[] | null | undefined,
  productOptions?:
    | ReadonlyArray<{
        id: string;
        values?: ReadonlyArray<string | { value: string }> | null;
      }>
    | null
    | undefined,
  selectedOptions?: Record<string, string>,
): VariantProjection {
  const vars = variants ?? [];
  const selected =
    selectedOptions ??
    defaultVariantOptions(productOptions, vars);

  const resolved = resolveVariantByOptions(vars, selected);

  if (!resolved) {
    return {
      variantId: null,
      price: null,
      isAvailable: false,
      inventoryQuantity: null,
      allowBackorder: false,
      selectedOptions: selected,
    };
  }

  const inv = resolved.manage_inventory !== false;
  const qty = resolved.inventory_quantity ?? null;
  const backorder = resolved.allow_backorder === true;
  const available = !inv || (qty !== null && qty > 0) || backorder;

  return {
    variantId: resolved.id,
    price: resolved.calculated_price ?? null,
    isAvailable: available,
    inventoryQuantity: qty,
    allowBackorder: backorder,
    selectedOptions: selected,
  };
}

/**
 * Returns the cheapest variant's price, or null when no variants have a
 * price.  Used by product cards and as a fallback headline.
 */
export function cheapestVariantPrice<V extends ResolvableVariant>(
  variants: V[] | null | undefined,
): PriceView | null {
  const vars = variants ?? [];
  if (vars.length === 0) return null;

  let best: number | null = null;
  let bestPrice: PriceView | null = null;

  for (const v of vars) {
    const amt = v.calculated_price?.calculated_amount;
    if (amt == null) continue;
    if (best === null || amt < best) {
      best = amt;
      bestPrice = v.calculated_price!;
    }
  }

  return bestPrice;
}

// ---- Display formatting ----

/**
 * Format a Medusa calculated price for display.
 *
 * Medusa Store API calculated prices are already returned as display-unit
 * amounts. This helper does NOT calculate totals or convert currencies — it
 * just splits the `calculated_amount` + `currency_code` pair.
 *
 * Returns `null` when `amount` or `currency` is missing — callers should
 * render a "price unavailable" fallback.
 */
export function formatPriceForDisplay(
  amount: number | null | undefined,
  currency: string | null | undefined,
): PriceParts | null {
  if (amount == null || !currency) return null;

  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  const [whole, decimal] = formatted.split(".");

  return {
    whole: whole ?? "0",
    decimal: decimal ?? "00",
    currency: currency.toUpperCase(),
  };
}
