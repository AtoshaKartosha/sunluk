// ponytail: localized display names for the seeded packaging handles.
// Medusa's cart product join and product.list endpoint do not reliably
// apply translations for the Packaging category (no EN/RU translations
// are seeded for packaging; the seed sets the base title directly, and
// the default locale varies per environment), so product.title leaks
// the wrong language. getPackagingName picks the name by handle + locale
// from these explicit maps so both the PDP and the cart show the
// correct name regardless of what Medusa returns. Add new handles here
// when seeding new packaging.
export const EN_PACKAGING_NAMES: Record<string, string> = {
  "velvet-pouch": "Branded Pouch",
  "gift-box": "Gift Box",
  "silk-pouch": "Silk Pouch",
  "wooden-case": "Wooden Case",
  "cotton-pouch-turquoise": "Branded Pouch (Turquoise)",
  "cotton-pouch-brown": "Branded Pouch (Brown)",
};

export const RU_PACKAGING_NAMES: Record<string, string> = {
  "velvet-pouch": "Фирменный мешочек",
  "gift-box": "Подарочная коробка",
  "silk-pouch": "Шелковый мешочек",
  "wooden-case": "Деревянный футляр",
  "cotton-pouch-turquoise": "Фирменный мешочек (Бирюзового цвета)",
  "cotton-pouch-brown": "Фирменный мешочек (Коричневого цвета)",
};

export function getPackagingName(
  product: { handle?: string | null; title?: string | null },
  locale: string,
): string {
  if (product.handle) {
    if (locale.startsWith("en") && product.handle in EN_PACKAGING_NAMES) {
      return EN_PACKAGING_NAMES[product.handle]!;
    }
    if (!locale.startsWith("en") && product.handle in RU_PACKAGING_NAMES) {
      return RU_PACKAGING_NAMES[product.handle]!;
    }
  }
  return product.title ?? "";
}
