import type { CalculatedPrice } from "./types";

interface PriceDisplayProps {
  /** A single calculated price, or the cheapest variant's price. */
  price: CalculatedPrice | null | undefined;
  /** Optional class for the price text wrapper. */
  className?: string;
  /** Text shown when price is unavailable. Defaults to "Цена по запросу". */
  unavailableCopy?: string;
}

function formatPriceValue(amount: number, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: currencyCode.toUpperCase(),
      minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    // Fallback for unknown currency codes
    return `${amount.toFixed(2)} ${currencyCode.toUpperCase()}`;
  }
}

export function PriceDisplay({
  price,
  className = "",
  unavailableCopy = "Цена по запросу",
}: PriceDisplayProps) {
  if (!price || price.calculated_amount == null) {
    return (
      <span
        className={`text-sm text-[#2c211b]/50 italic ${className}`}
        aria-label="Price unavailable"
      >
        {unavailableCopy}
      </span>
    );
  }

  const formatted = formatPriceValue(
    price.calculated_amount,
    price.currency_code ?? "dkk",
  );

  return (
    <span
      className={`text-lg font-semibold tracking-wide text-[#2c211b] ${className}`}
      aria-label={`Price: ${formatted}`}
    >
      {formatted}
    </span>
  );
}
