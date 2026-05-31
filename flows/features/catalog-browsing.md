# Catalog Browsing Flow

## 1. Intent

Let a storefront visitor discover sellable products for their selected region, inspect product details, choose a valid variant, and hand the chosen item to the cart flow.

Success criteria:

- Visitor sees only published products available through the storefront sales channel.
- Prices and availability are region-aware.
- Variant selection produces a concrete `{ productId, variantId, quantity, regionId }` handoff.
- Missing region, unavailable product, or invalid variant selection is rejected before cart mutation.

## 2. Scope

In scope:

- Region-aware product listing.
- Product detail viewing from the product list.
- Variant display and local variant selection on product detail.
- Quantity selection and cart handoff when the cart flow is implemented.

Out of scope:

- Search ranking, recommendations, reviews, wishlists, and personalization.
- Admin creation/editing of catalog data; see `flows/features/admin-operations.md`.
- Cart creation, cart persistence, checkout, and payment; see `flows/features/cart-checkout.md`.

Deferred decisions:

- Explicit geolocation/locale-based region selection. v0 uses `NEXT_PUBLIC_DEFAULT_REGION` and falls back to `dk`; unsupported configured values render an unsupported-region state.
- Whether out-of-stock products are hidden or displayed as unavailable. v0 displays Store API sellable products returned by Medusa and disables purchase actions when a selected variant is not available.
- Final SUNLUK production product data. v0 renders whatever published Store API products Medusa returns for the configured region/sales channel.

## 3. Actors and Permissions

| Actor | Permissions | Authority source |
|---|---|---|
| Anonymous visitor | View published storefront catalog; choose variants | Medusa store API publishable key and sales channel visibility |
| Authenticated customer | Same as anonymous visitor, plus customer-specific pricing if configured later | Medusa customer/session state |
| Admin user | Controls products, prices, categories, inventory, regions | Medusa admin API/admin dashboard |

## 4. Diagrams

### User flow

```mermaid
flowchart TD
  Start[Visitor opens product list] --> ConfigRegion[Read configured default country]
  ConfigRegion --> Region{Supported region found?}
  Region -->|no| Unsupported[Show unsupported-region error]
  Region -->|yes| LoadCatalog[Load published products for region]
  LoadCatalog --> Loaded{Request succeeded?}
  Loaded -->|no| CatalogError[Show retryable catalog error]
  Loaded -->|yes| Products{Products returned?}
  Products -->|no| Empty[Show empty catalog state]
  Products -->|yes| List[Show product list]
  List --> Detail[Open product detail by handle]
  Detail --> DetailLoad{Product found for region?}
  DetailLoad -->|no| NotFound[Show not found]
  DetailLoad -->|yes| ProductView[Show product detail]
  ProductView --> Variant{Valid variant selected?}
  Variant -->|no| DisableAdd[Keep add-to-cart disabled and explain missing choice]
  Variant -->|yes| Quantity{Quantity valid?}
  Quantity -->|no| RejectQty[Reject quantity]
  Quantity -->|yes| Handoff[Emit cart:item-selected when cart flow is wired]

### State machine

```mermaid
stateDiagram-v2
  [*] --> RegionResolving
  RegionResolving --> RegionSelected: default country belongs to supported region
  RegionResolving --> RegionUnsupported: default country unsupported
  RegionSelected --> CatalogLoading: request catalog
  CatalogLoading --> CatalogReady: products loaded
  CatalogLoading --> CatalogEmpty: no products
  CatalogLoading --> CatalogError: request failed
  CatalogReady --> ProductViewing: product opened by handle
  ProductViewing --> ProductNotFound: handle missing, unpublished, or not sellable in region
  ProductViewing --> VariantIncomplete: product loaded but required options missing
  VariantIncomplete --> VariantSelected: all options resolve to variant
  ProductViewing --> VariantSelected: default selection resolves to variant
  VariantSelected --> ReadyForCart: quantity valid
  ReadyForCart --> [*]: cart:item-selected when cart flow is wired
  CatalogError --> CatalogLoading: retry
```

### Data/event flow

```mermaid
flowchart LR
  Visitor[Visitor] --> UI[Next.js product routes]
  UI --> Config[Default country config]
  Config --> RegionQuery[Medusa regions query]
  RegionQuery --> SDK[Medusa JS SDK / Store API]
  UI --> ProductQuery[Product list/detail query]
  ProductQuery --> SDK
  SDK --> Backend[Medusa backend]
  Backend --> Catalog[(Products, variants, prices, regions, sales channel)]
  Catalog --> Backend
  Backend --> UI
  UI --> Selection[Local variant and quantity selection]
  Selection --> Event[cart:item-selected]
  Event --> Cart[Cart and Checkout Flow]
```

## 5. State and Projections

Authoritative state:

- Products, categories, variants, prices, regions, inventory and sales channel membership live in Medusa.
- Seed data currently creates Europe region, default sales channel, product categories, products, variants, prices, stock location, and shipping options in `backend/apps/backend/src/migration-scripts/initial-data-seed.ts`.

Storefront projection:

- Selected default region/country resolved from configuration.
- Product list response for that region.
- Product detail response selected by product handle.
- Local variant option selection before a concrete variant exists.
- Local quantity input before cart handoff.

## 6. Events/Actions

| Direction | Name | Target flow | Payload | Allowed when | Reject reason |
|---|---|---|---|---|---|
| Incoming | `catalog:published` | Catalog Browsing | `{ productIds?, categoryIds?, regionIds?, salesChannelIds? }` | Admin publishes catalog data in Medusa | Not applicable to storefront |
| Internal | `catalog:region-selected` | None | `{ regionId, countryCode }` | Configured country belongs to supported region | Unsupported country |
| Internal | `catalog:product-opened` | None | `{ productHandle, regionId }` | Region known and product handle exists | Missing region or product not sellable |
| Outgoing | `cart:item-selected` | Cart and Checkout | `{ productId, variantId, quantity, regionId }` | Variant is valid, quantity is positive, and cart UI is enabled | Missing variant, invalid quantity, unavailable product |

## 7. Edge Cases

- Configured default country is missing: use `dk` for v0 and keep the selected region visible in code/config, not hardcoded in UI copy.
- Configured/default country is unsupported: show a clear unsupported-region state; do not fall back silently to another region after a failed lookup.
- Product exists but is unpublished or not in storefront sales channel: treat as not found for visitors.
- Product detail handle does not exist: render Next.js not-found state.
- Variant options do not resolve to a variant: keep add-to-cart disabled.
- Quantity is zero, negative, or not an integer: reject locally before any cart handoff.
- Product/variant becomes unavailable between detail load and cart handoff: cart flow must revalidate through Medusa.
- Store API request fails: show retryable error without mutating cart state.

## 8. Side Effects

- Storefront navigation from `/products` list to `/products/[handle]` detail.
- Region selection/config affects product prices and cart compatibility.
- `cart:item-selected` begins cart mutation in the cart flow once the cart UI is wired; current product-screen slice may render disabled/pending add-to-cart if cart flow is not yet implemented.

## 9. Schemas Touched

Expected implementation files for the product-list-to-product-detail slice:

- `storefront/src/app/products/page.tsx`.
- `storefront/src/app/products/[handle]/page.tsx`.
- `storefront/src/lib/medusa.ts`.
- `storefront/src/lib/medusa/regions.ts`.
- `storefront/src/lib/medusa/products.ts`.
- `storefront/src/lib/price.ts`.
- `storefront/src/components/product/ProductCard.tsx`.
- `storefront/src/components/product/ProductGrid.tsx`.
- `storefront/src/components/product/ProductGallery.tsx`.
- `storefront/src/components/product/VariantSelector.tsx`.
- `storefront/src/components/product/PriceDisplay.tsx`.
- Medusa Store API product, region, and pricing response types from `@medusajs/js-sdk`.

Current files that inform the flow:

- `backend/apps/backend/src/migration-scripts/initial-data-seed.ts`.
- `backend/apps/backend/medusa-config.ts`.

## 10. Targeted Tests

| Layer | Behavior | File | Status |
|---|---|---|---|
| Storefront unit | Region resolver chooses configured/default country only when Medusa returns a supported region | `storefront/src/lib/medusa/regions.test.ts` or nearest project test equivalent | Pending implementation |
| Storefront unit | Product price display uses Store API calculated price and does not calculate totals | `storefront/src/lib/price.test.ts` or nearest project test equivalent | Pending implementation |
| Storefront UI/integration | Product list links each product card to `/products/[handle]` | To add with storefront catalog implementation | Pending implementation |
| Storefront UI/integration | Product detail for unknown/unpublished handle renders not found/error state | To add with product detail implementation | Pending implementation |
| Storefront UI/integration | Variant cannot be added until all required options resolve to a real variant | To add with product detail implementation | Pending implementation |

## 11. Implementation Plan

1. Add a Medusa Store API client wrapper using configured backend URL and publishable key.
2. Add default region resolution before product requests.
3. Add `/products` listing filtered by resolved region and sales channel.
4. Add `/products/[handle]` detail page with gallery, price display, option/variant resolution, and disabled cart action until cart flow is wired.
5. Emit only validated `cart:item-selected` payloads to cart code when cart implementation exists.

## 12. Implementation Trace

Current status: product-list-to-product-detail slice implemented.

Code files:

- `storefront/src/app/products/page.tsx`
- `storefront/src/app/products/[handle]/page.tsx`
- `storefront/src/lib/medusa.ts`
- `storefront/src/lib/medusa/regions.ts`
- `storefront/src/lib/medusa/products.ts`
- `storefront/src/lib/price.ts`
- `storefront/src/components/product/ProductCard.tsx`
- `storefront/src/components/product/ProductGrid.tsx`
- `storefront/src/components/product/ProductGallery.tsx`
- `storefront/src/components/product/VariantSelector.tsx`
- `storefront/src/components/product/PriceDisplay.tsx`
- `storefront/src/components/product/types.ts`
- `storefront/src/components/product/index.ts`

Validation:

- `npm run lint --prefix storefront` — passed.
- `npm run build --prefix storefront` — passed.

Notes:

- `/` landing remains active.
- `/products` resolves the configured/default region and lists Medusa Store API products.
- `/products/[handle]` resolves the same region, loads product detail by handle, and renders not-found for missing products.
- Cart mutation remains deferred to `flows/features/cart-checkout.md`; variant UI resolves a valid variant but leaves the cart CTA disabled with pending copy.

## 13. Open Questions

- Should production default region remain Denmark (`dk`) or use a different first market for Sunluk? v0 proceeds with `NEXT_PUBLIC_DEFAULT_REGION ?? "dk"` until product chooses otherwise.
- Should region selection later be explicit, inferred, or both? v0 defers selector UI.
- Should unavailable products be hidden or shown with disabled purchase actions? v0 follows Store API product visibility and disables impossible variant/cart actions.

## 14. Review Checklist

- [x] Region boundary is explicit before catalog/cart operations.
- [x] Product visibility depends on Medusa published/sales-channel state.
- [x] Variant and quantity are validated before cart handoff.
- [x] Cross-flow `cart:item-selected` appears in architecture and cart flow.
- [x] Product list -> detail route is explicit for the current implementation slice.
- [x] v0 region fallback is explicit and does not silently mask unsupported configured regions.
