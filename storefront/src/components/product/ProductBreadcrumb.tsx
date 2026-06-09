import Link from "next/link";
import type { Locale } from "@/i18n/routing";

interface ProductBreadcrumbProps {
  /** Product title shown as the last segment. */
  title: string;
  /** Current locale for link prefix. */
  locale: Locale;
  /** Label for the catalog link (e.g. "CATALOG"). */
  catalogLabel: string;
}

/**
 * Server-compatible breadcrumb for PDP.
 * Renders: Catalog → Product Title
 */
export function ProductBreadcrumb({
  title,
  locale,
  catalogLabel,
}: ProductBreadcrumbProps) {
  const catalogHref = `/${locale}/products`;

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-2 text-[10px] font-medium tracking-[0.15em] uppercase text-[#2c211b]/50">
        <li>
          <Link
            href={catalogHref}
            className="hover:text-[#2f6f78] transition-colors"
          >
            {catalogLabel}
          </Link>
        </li>
        <li aria-hidden="true" className="select-none">
          /
        </li>
        <li className="text-[#2c211b] truncate max-w-[200px]" aria-current="page">
          {title}
        </li>
      </ol>
    </nav>
  );
}
