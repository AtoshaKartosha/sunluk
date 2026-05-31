# Flow Architecture

## Project shape

Sunluk Commerce is a Medusa + Next.js commerce project.

- `backend/apps/backend` is the Medusa backend and admin surface.
- `storefront` is the Next.js customer storefront.
- Current storefront implementation includes the SUNLUK landing page plus Medusa-backed product list/detail routes; cart and checkout behavior below remains the intended next flow baseline.

## Flow map

```mermaid
flowchart LR
  subgraph Catalog["Catalog Browsing\nflows/features/catalog-browsing.md"]
    C0[Region selected]
    C1[Products listed]
    C2[Product detail viewed]
  end

  subgraph Localization["Catalog Localization\nflows/features/catalog-localization.md"]
    L0[Locale selected]
    L1[Localized content requested]
    L2[Fallback or localized content rendered]
  end

  subgraph Cart["Cart and Checkout\nflows/features/cart-checkout.md"]
    K0[Cart active]
    K1[Checkout complete]
  end

  subgraph Admin["Admin Operations\nflows/features/admin-operations.md"]
    A0[Admin authenticated]
    A1[Catalog and commerce settings managed]
  end
  subgraph Cabinet["Customer Cabinet\nflows/features/customer-cabinet.md"]
    U0[Customer authenticated]
    U1[Cabinet dashboard viewed]
    U2[Order history browsed]
  end
  Admin -- "catalog:published" --> Catalog
  Admin -- "catalog:published" --> Localization
  Admin -- "catalog:translation-published" --> Localization
  Localization -- "catalog:localized-content-ready" --> Catalog
  Admin -- "commerce:settings-updated" --> Cart
  Catalog -- "cart:item-selected" --> Cart
  Cart -- "order:placed" --> Admin
  Cart -- "order:placed" --> Cabinet

## Cross-flow contracts
| Source | Event/data | Target | Notes |
|---|---|---|---|
| Admin Operations | `catalog:published` | Catalog Browsing | Payload: `{ productIds?, categoryIds?, regionIds?, salesChannelIds? }`. Medusa is the authority; storefront reads only published, sales-channel-visible data. |
| Admin Operations | `catalog:published` | Catalog Localization | Payload: `{ productIds?, categoryIds?, regionIds?, salesChannelIds? }`. Publishing product source content makes it eligible for localized storefront reads. |
| Admin Operations | `catalog:translation-published` | Catalog Localization | Payload: `{ productIds, locales }`. Admin saves localized product content in Medusa for supported storefront locales. |
| Catalog Localization | `catalog:localized-content-ready` | Catalog Browsing | Payload: `{ locale, medusaLocale, fallbackProductIds? }`. Catalog UI renders localized product content or explicit source fallback. |
| Admin Operations | `commerce:settings-updated` | Cart and Checkout | Payload: `{ regionIds?, shippingOptionIds?, paymentProviderIds?, priceListIds? }`. Cart and checkout revalidate through Medusa before mutation/completion. |
| Catalog Browsing | `cart:item-selected` | Cart and Checkout | Payload: `{ productId, variantId, quantity, regionId }`. |
| Cart and Checkout | `order:placed` | Customer Cabinet | Payload: `{ orderId, cartId, customerId? }`. Placing an order registers it in the customer's account orders list. |
| Cart and Checkout | `order:placed` | Admin Operations | Payload: `{ orderId, cartId, customerId? }`; order appears in Medusa admin/order management. |

## Non-negotiables

- Backend-owned commerce state is authoritative: products, prices, regions, carts, orders, payments, fulfillment.
- Storefront must not calculate final totals independently; it can display totals returned by Medusa.
- Region and sales channel must be selected before price-sensitive product/cart operations.
- Checkout must reject incomplete or stale cart state instead of silently creating incorrect orders.

## Current implementation trace

- Backend config: `backend/apps/backend/medusa-config.ts`.
- Seeded commerce data: `backend/apps/backend/src/migration-scripts/initial-data-seed.ts`.
- Placeholder custom routes: `backend/apps/backend/src/api/store/custom/route.ts`, `backend/apps/backend/src/api/admin/custom/route.ts`.
- Storefront entry points: `storefront/src/app/page.tsx`, `storefront/src/app/products/page.tsx`, `storefront/src/app/products/[handle]/page.tsx`.
