# Catalog Localization Flow

## 1. Intent

Let a storefront visitor read product title and description in Russian or English while prices, availability, and checkout compatibility continue to be controlled by the independently selected Medusa region.

Success criteria:

- Storefront supports exactly two customer-facing locales for v1: `ru` -> `ru-RU` and `en` -> `en-US`.
- Product list and product detail pages request Medusa product content in the active locale on every server render.
- Product `title` and `description` fall back to the product's default Medusa content when a requested translation is missing.
- Locale selection does not change region, currency, price calculation, or product availability rules.
- Admin-managed translations become visible in storefront without requiring storefront-side product duplication.

## 2. Scope

In scope:

- Locale-aware routing for storefront catalog pages.
- Locale-aware Store API product list/detail reads.
- Rendering localized `title` and `description` on product cards and product detail views.
- Translating catalog-page UI copy needed for the localized product experience.
- Admin workflow for maintaining product translations in Medusa.

Out of scope:

- Localized product handles, category slugs, or separate SEO slugs per language.
- Full-store translation of checkout, cabinet, landing page, or admin chrome outside the catalog slice.
- Automatic machine translation or AI-generated translations.
- Locale-driven region switching.

Deferred decisions:

- Whether to localize additional product attributes (material labels, option names, variant labels, shipping copy) in the same slice or a follow-up slice.
- Whether to add browser-language auto-redirect on first visit. v1 supports explicit locale-prefixed URLs only.

Chosen v1 decisions:

- Storefront routes are locale-prefixed: `/ru/...` and `/en/...`.
- Product handles remain stable across locales.
- Medusa Store API locale values are `ru-RU` and `en-US`.

## 3. Actors and Permissions

| Actor | Permissions | Authority source |
|---|---|---|
| Anonymous visitor | Open localized catalog URLs, switch between supported locales, view localized published product content | Next.js locale routing + Medusa Store API publishable access |
| Authenticated customer | Same as anonymous visitor; locale choice does not grant extra catalog access | Next.js locale routing + Medusa customer/session state |
| Admin user | Configure supported store locales and maintain product translations | Medusa Admin authentication/authorization |
| Medusa backend | Stores source product data and translations; applies locale fallback for Store API responses | Medusa modules and translation subsystem |

## 4. Diagrams

### User flow

```mermaid
flowchart TD
  Start[Visitor opens locale-prefixed catalog URL] --> Locale{Locale segment supported?}
  Locale -->|no| Rewrite[Rewrite to default /ru route]
  Locale -->|yes| Region[Resolve storefront region]
  Rewrite --> Region
  Region --> RegionOk{Supported region found?}
  RegionOk -->|no| UnsupportedRegion[Show unsupported-region state]
  UnsupportedRegion --> SwitchRegionLocale[Visitor changes locale]
  SwitchRegionLocale --> Reload
  RegionOk -->|yes| LoadCatalog[Request products from Medusa with region + locale]
  LoadCatalog --> CatalogOk{Request succeeded?}
  CatalogOk -->|no| CatalogError[Show retryable catalog error]
  CatalogOk -->|yes| List[Render product cards with localized title and description]
  List --> Detail[Open localized product detail route]
  Detail --> LoadDetail[Request product detail from Medusa with same locale]
  LoadDetail --> DetailOk{Product found for region?}
  DetailOk -->|no| NotFound[Render not found]
  DetailOk -->|yes| Translation{Translation exists for requested locale?}
  Translation -->|yes| LocalizedView[Render requested locale content]
  Translation -->|no| FallbackView[Render default product content and keep locale chrome]
  LocalizedView --> Switch[Visitor changes locale]
  FallbackView --> Switch
  Switch --> Reload[Reload same route with new locale prefix]
  Reload --> Region
```

### State machine

```mermaid
stateDiagram-v2
  [*] --> LocaleResolving
  LocaleResolving --> LocaleSelected: locale segment is ru or en
  LocaleResolving --> LocaleDefaulted: unsupported or missing locale rewritten to ru
  LocaleSelected --> RegionResolving
  LocaleDefaulted --> RegionResolving
  RegionResolving --> RegionUnsupported: configured country unsupported
  RegionResolving --> CatalogLoading: supported region found
  CatalogLoading --> CatalogReady: localized products returned
  CatalogLoading --> CatalogError: Store API failure
  CatalogReady --> ProductLoading: visitor opens product detail
  ProductLoading --> ProductReadyLocalized: translated title/description returned
  ProductLoading --> ProductReadyFallback: product found but requested translation missing
  ProductLoading --> ProductNotFound: handle missing, unpublished, or not sellable
  ProductLoading --> ProductError: product request failed
  CatalogReady --> LocaleSwitching: visitor changes locale from list
  CatalogError --> LocaleSwitching: visitor changes locale from error state
  RegionUnsupported --> LocaleSwitching: visitor changes locale from unsupported-region state
  ProductReadyLocalized --> LocaleSwitching: visitor changes locale
  ProductReadyFallback --> LocaleSwitching: visitor changes locale
  ProductError --> LocaleSwitching: visitor changes locale
  LocaleSwitching --> CatalogLoading: locale switch from list/error route
  LocaleSwitching --> ProductLoading: same handle, new locale request
  CatalogError --> CatalogLoading: retry
  ProductError --> ProductLoading: retry
```
### Data/event flow

```mermaid
flowchart LR
  Visitor[Visitor] --> Route[Next.js /[locale]/products routes]
  Route --> LocaleMap[Locale routing map ru->ru-RU en->en-US]
  Route --> RegionResolver[Region resolver]
  LocaleMap --> ProductQuery[Request-scoped product query]
  RegionResolver --> ProductQuery
  ProductQuery --> SDK[Medusa Store SDK / API]
  SDK --> Backend[Medusa backend]
  Backend --> ProductStore[(Products + translations + region pricing)]
  ProductStore --> Backend
  Backend --> LocalizedProjection[Localized Store API response or source fallback]
  LocalizedProjection --> Route
  Admin[Medusa Admin user] --> AdminUI[Medusa Admin translations/settings]
  AdminUI --> Backend
  Backend --> PublishEvent[catalog:published]
  Backend --> TranslationEvent[catalog:translation-published]
  PublishEvent --> Localization[Catalog Localization Flow]
  TranslationEvent --> Localization
  Localization --> Catalog[Catalog Browsing Flow]
```

## 5. State and Projections

Authoritative state:

- Product source content, translation records, supported store locales, and fallback behavior live in Medusa.
- Region, currency, pricing, inventory, and publishability remain Medusa-owned and are unchanged by locale selection.

Storefront projection:

- Active route locale (`ru` or `en`).
- Derived Medusa locale code (`ru-RU` or `en-US`).
- Region resolved independently from locale.
- Localized product list/detail response for the current locale.
- Fallback rendering state when the product exists but requested translation fields are absent.

Admin projection:

- Medusa Admin locale configuration.
- Product translation editing surface for translated `title` and `description`.

## 6. Events/Actions

| Direction | Name | Target flow | Payload | Allowed when | Reject reason |
|---|---|---|---|---|---|
| Incoming | `catalog:published` | Catalog Localization | `{ productIds?, categoryIds?, regionIds?, salesChannelIds? }` | Admin publishes products that the storefront may read | None; publishing is authoritative input from Medusa admin state |
| Incoming | `catalog:translation-published` | Catalog Localization | `{ productIds, locales }` | Admin saves product translations for supported locales | Unsupported locales are ignored by storefront routing until explicitly enabled |
| Internal | `catalog:locale-selected` | None | `{ locale: "ru" | "en", medusaLocale: "ru-RU" | "en-US" }` | Route locale is supported or rewritten to default | Unsupported locale outside configured set |
| Internal | `catalog:localized-products-requested` | None | `{ regionId, locale, medusaLocale }` | Locale and region are both known | Missing locale or unresolved region |
| Outgoing | `catalog:localized-content-ready` | Catalog Browsing | `{ locale, medusaLocale, fallbackProductIds? }` | Localized catalog or product detail payload is ready for rendering | Store API request failed |

## 7. Edge Cases

- Visitor requests `/de/products`: storefront rewrites to `/ru/products`; it does not guess or preserve an unsupported locale.
- Locale and region disagree (for example `en` locale with Denmark region): allow it; locale never mutates region.
- Medusa product exists but requested translation is missing: render default product `title`/`description` and keep the rest of the page in the requested UI locale.
- Translation exists for title but not description: field-level fallback applies only to the missing field; do not blank the field.
- Product detail route handle is stable across locales; switching locale on a valid handle must keep the same handle.
- Language switch occurs while using a singleton SDK with stale locale headers: forbidden implementation; requests must be request-scoped or explicitly locale-scoped to avoid cross-request leakage.
- Seed data contains mixed-language source titles/descriptions: until translations are populated, fallback content may remain mixed; rollout must treat this as incomplete merchandising data, not a storefront bug.
- Admin saves translation for a locale that storefront does not support: Medusa may store it, but storefront ignores it until the locale is added to routing.
- Store API localization request fails while base catalog would otherwise load: show retryable error; do not silently retry without locale because that would hide a backend misconfiguration.

## 8. Side Effects

- Storefront navigation uses locale-prefixed catalog URLs.
- Language switch reloads the same catalog route under a different locale prefix.
- Store API requests include locale alongside region for every catalog/product read.
- Admin translation edits become visible on the next storefront revalidation/request.
- Fallback rendering may expose source-language product copy until translations are filled; merchandising operations must monitor this during rollout.

## 9. Schemas Touched

Expected implementation files for this slice:

- `storefront/src/middleware.ts`.
- `storefront/src/i18n/routing.ts`.
- `storefront/src/i18n/request.ts`.
- `storefront/messages/ru.json`.
- `storefront/messages/en.json`.
- `storefront/src/app/[locale]/layout.tsx`.
- `storefront/src/app/[locale]/products/page.tsx`.
- `storefront/src/app/[locale]/products/[handle]/page.tsx`.
- `storefront/src/lib/medusa.ts` or a request-scoped Store API client helper replacing the current locale-unsafe singleton path.
- `storefront/src/lib/medusa/products.ts`.
- `storefront/src/components/product/ProductCard.tsx`.
- `storefront/src/components/product/ProductInfoBlock.tsx`.
- `storefront/src/components/product/types.ts`.
- `backend/apps/backend/medusa-config.ts`.
- `backend/apps/backend/src/migration-scripts/initial-data-seed.ts`.
- `backend/apps/backend/src/admin/i18n/index.ts` if custom admin translation helpers are needed.

Current files that inform the flow:

- `flows/features/catalog-browsing.md`.
- `flows/features/admin-operations.md`.
- `storefront/src/app/layout.tsx`.
- `storefront/src/app/products/page.tsx`.
- `storefront/src/app/products/[handle]/page.tsx`.
- `storefront/src/lib/medusa.ts`.
- `storefront/src/lib/medusa/products.ts`.

## 10. Targeted Tests

| Layer | Behavior | File | Status |
|---|---|---|---|
| Storefront unit | Locale router maps `ru`/`en` to `ru-RU`/`en-US` and rejects unsupported locale prefixes | `storefront/src/i18n/routing.test.ts` or nearest project test equivalent | Pending implementation |
| Storefront integration | Product list sends both `region_id` and locale to Medusa on `/[locale]/products` | `storefront/src/lib/medusa/products.test.ts` or nearest project test equivalent | Pending implementation |
| Storefront integration | Product detail keeps same handle when switching between `/ru/products/[handle]` and `/en/products/[handle]` | To add with localized route implementation | Pending implementation |
| Storefront integration | Missing translation falls back to source content for only the missing field | `storefront/src/lib/medusa/products.test.ts` or nearest project test equivalent | Pending implementation |
| Backend integration | Store API returns translated `title`/`description` for populated locales and source fallback otherwise | `backend/integration-tests/http/store/product-localization.spec.ts` or nearest project test equivalent | Pending implementation |
| Manual/admin QA | Updating a product translation in Medusa Admin is reflected in storefront after revalidation | Manual admin QA checklist for launch | Pending implementation |

## 11. Implementation Plan

1. Add storefront locale routing and message catalogs for `ru` and `en` using locale-prefixed routes.
2. Replace locale-unsafe product SDK usage with request-scoped locale-aware Store API reads.
3. Localize product list/detail pages and product card/detail components for UI copy plus localized `title`/`description` rendering.
4. Enable Medusa locales/translations configuration and seed or enter RU/EN product translations.
5. Add targeted tests for locale mapping, Medusa request payloads, field-level fallback, and Store API translated responses.

## 12. Implementation Trace

Current status: flow document only. No implementation has been applied yet.

Expected code files:

- `storefront/src/middleware.ts`
- `storefront/src/i18n/routing.ts`
- `storefront/src/i18n/request.ts`
- `storefront/messages/ru.json`
- `storefront/messages/en.json`
- `storefront/src/app/[locale]/layout.tsx`
- `storefront/src/app/[locale]/products/page.tsx`
- `storefront/src/app/[locale]/products/[handle]/page.tsx`
- `storefront/src/lib/medusa.ts`
- `storefront/src/lib/medusa/products.ts`
- `storefront/src/components/product/ProductCard.tsx`
- `storefront/src/components/product/ProductInfoBlock.tsx`
- `storefront/src/components/product/types.ts`
- `backend/apps/backend/medusa-config.ts`
- `backend/apps/backend/src/migration-scripts/initial-data-seed.ts`

Validation:

- Not run yet.

## 13. Open Questions

- Should the storefront remember the last chosen locale in a cookie in addition to the URL prefix, or is the URL alone sufficient for v1?
- Do merchandising teams want localized option/material labels in the same release, or only product title/description?
- Should launch QA block publication of products that are missing either RU or EN translation, or is source-language fallback acceptable during staged rollout?

## 14. Review Checklist

- [x] Locale is explicit and independent from region.
- [x] Missing translation fallback is explicit.
- [x] Unsupported locale handling is explicit.
- [x] Product handles remain stable across locales.
- [x] Locale-aware Store API reads and locale-unsafe singleton risk are named.
- [x] Admin translation publication boundary is declared.
- [x] Targeted tests cover both localized and fallback paths.
