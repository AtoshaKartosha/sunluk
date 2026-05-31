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
 * Medusa stores prices in minor units (cents/øre). This helper does NOT
 * calculate totals or convert currencies — it only formats a single
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

  // Convert minor units → major (e.g. 10900 → 109.00)
  const major = amount / 100;

  // Simple formatting: group thousands, always 2 decimal places.
  // We use a locale-agnostic split so the caller can style whole/decimal independently.
  const formatted = major.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const [whole, decimal] = formatted.split(".");

  return {
    whole: whole ?? "0",
    decimal: decimal ?? "00",
    currency: currency.toUpperCase(),
  };
}
