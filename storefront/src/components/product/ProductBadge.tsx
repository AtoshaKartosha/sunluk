import { useTranslations } from "next-intl";

// Manual marketing label stored at product.metadata.badge. Coexists with — and
// must not override — the functional stock logic in lib/price.ts.
const KNOWN_BADGES = ["in_stock", "sold_out", "pre_order", "discount"] as const;
type KnownBadge = (typeof KNOWN_BADGES)[number];

const BADGE_STYLES: Record<KnownBadge, string> = {
  in_stock: "bg-[#2f6f78] text-white",
  sold_out: "bg-[#2c211b] text-white",
  pre_order: "bg-[#6b5b4a] text-white",
  discount: "bg-[#b85c3a] text-white",
};

function isKnownBadge(value: string | null | undefined): value is KnownBadge {
  return !!value && (KNOWN_BADGES as readonly string[]).includes(value);
}

interface ProductBadgeProps {
  badge?: string | null;
}

/**
 * Corner status badge overlay for catalog product photos. Renders nothing for
 * absent or unknown badge values. Place inside a `relative` parent.
 */
export function ProductBadge({ badge }: ProductBadgeProps) {
  const t = useTranslations("badge");
  if (!isKnownBadge(badge)) return null;
  return (
    <span
      className={`absolute top-2 right-2 z-10 rounded-sm px-2.5 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm ${BADGE_STYLES[badge]}`}
    >
      {t(badge)}
    </span>
  );
}
