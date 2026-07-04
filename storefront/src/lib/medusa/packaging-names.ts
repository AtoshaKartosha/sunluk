// ponytail: localized display names for the seeded packaging handles.
//
// Medusa's `*items.product` expand in the cart endpoint does NOT apply the
// `x-medusa-locale` header to the product's `title` — it returns the base
// (default-locale) title. So `linkedItem.product.title` leaks the wrong
// language for packaging, even when a ru-RU translation is configured in
// Medusa admin.
//
// The translation IS applied during line-item creation: Medusa sets
// `line_item.title` from the product at the moment the item is added,
// localized by the request's `x-medusa-locale`. So the line-item snapshot
// (`line_item.title`) is the source of truth for the translated name in
// the cart, as long as the item was added on the locale you want to read.
//
// Resolution order:
//   1. Explicit handle map (EN/RU) for known seeded handles — always
//      returns the correct localized name regardless of Medusa state.
//   2. The caller's snapshot (e.g. `line_item.title`) — the Medusa
//      translation captured at add time.
//   3. The product join's `title` — the base title, last resort.
export const EN_PACKAGING_NAMES: Record<string, string> = {
  "velvet-pouch": "Branded Pouch",
  "brand-pouch": "Branded Pouch",
  "gift-box": "Gift Box",
  "silk-pouch": "Silk Pouch",
  "wooden-case": "Wooden Case",
  "cotton-pouch-turquoise": "Branded Pouch (Turquoise)",
  "turquoise-pouch": "Branded Pouch (Turquoise)",
  "cotton-pouch-brown": "Branded Pouch (Brown)",
  "brown-pouch": "Branded Pouch (Brown)",
};

export const RU_PACKAGING_NAMES: Record<string, string> = {
  "velvet-pouch": "Фирменный мешочек",
  "brand-pouch": "Фирменный мешочек",
  "gift-box": "Подарочная коробка",
  "silk-pouch": "Шелковый мешочек",
  "wooden-case": "Деревянный футляр",
  "cotton-pouch-turquoise": "Фирменный мешочек (Бирюзового цвета)",
  "turquoise-pouch": "Фирменный мешочек (Бирюзового цвета)",
  "cotton-pouch-brown": "Фирменный мешочек (Коричневого цвета)",
  "brown-pouch": "Фирменный мешочек (Коричневого цвета)",
};

export function getPackagingName(
  product: { handle?: string | null; title?: string | null } | null | undefined,
  locale: string,
  snapshot?: string | null,
): string {
  if (product?.handle) {
    if (locale.startsWith("en") && product.handle in EN_PACKAGING_NAMES) {
      return EN_PACKAGING_NAMES[product.handle]!;
    }
    if (!locale.startsWith("en") && product.handle in RU_PACKAGING_NAMES) {
      return RU_PACKAGING_NAMES[product.handle]!;
    }
  }
  return snapshot || product?.title || "";
}
