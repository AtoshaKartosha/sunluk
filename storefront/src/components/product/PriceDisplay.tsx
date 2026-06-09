import type { CalculatedPrice } from "./types";

interface PriceDisplayProps {
  /** A single calculated price, or the cheapest variant's price. */
  price: CalculatedPrice | null | undefined;
  /** Optional class for the price text wrapper. */
  className?: string;
  /** Text shown when price is unavailable. Defaults to "Цена по запросу". */
  unavailableCopy?: string;
}

import { useLocale, useTranslations } from "next-intl";

export function formatPriceValue(amount: number, currencyCode: string, locale: string = "ru"): string {
  try {
    const bcp47 = locale === "en" ? "en-US" : "ru-RU";
    return new Intl.NumberFormat(bcp47, {
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
  unavailableCopy,
}: PriceDisplayProps) {
  const locale = useLocale();
  const t = useTranslations("product");
  const fallbackCopy = unavailableCopy ?? t("priceUponRequest");

  if (!price || price.calculated_amount == null) {
    return (
      <span
        className={`text-sm text-[#2c211b]/50 italic ${className}`}
        aria-label="Price unavailable"
      >
        {fallbackCopy}
      </span>
    );
  }

  const formatted = formatPriceValue(
    price.calculated_amount,
    price.currency_code ?? "dkk",
    locale,
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
