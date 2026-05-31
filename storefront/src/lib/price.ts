// ---- Types ----

export interface PriceParts {
  /** Integer part of the formatted price (e.g. "10"). */
  whole: string;
  /** Fractional part (e.g. "00"). Always 2 digits. */
  decimal: string;
  /** Uppercase currency code (e.g. "DKK"). */
  currency: string;
}

// ---- Helpers ----

/**
 * Format a Medusa calculated price for display.
 *
 * Medusa Store API calculated prices are already returned as display-unit
 * amounts. This helper does NOT calculate totals or convert currencies — it
 * `calculated_amount` + `currency_code` pair.
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
