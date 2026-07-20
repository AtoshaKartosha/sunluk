# Admin Operations Flow

## 1. Intent

Let authorized managers configure Sunluk Commerce in Medusa Admin, publish catalog and commerce settings for the storefront, maintain localized product content, and manage orders created by checkout.

Success criteria:

- Only authenticated admin users can change catalog, translations, region, shipping, payment, promotion, inventory, and order state.
- Published catalog/configuration changes are consumed by storefront catalog and checkout flows through Medusa APIs.
- Product translations for supported storefront locales are stored in Medusa and become available to localized storefront catalog reads.
- Orders created by checkout become visible and actionable in admin order management.
- Storefront does not bypass admin-configured Medusa state.
- A trusted one-time migration reuses existing `purple` and `sun-chain` product identities for Amethyst and Lagoon, removing only redundant unreferenced duplicates.

## 2. Scope

In scope:

- Admin authentication boundary.
- Product/category/variant/price/inventory/sales-channel management.
- Product locale and translation management for supported storefront languages.
- Region, shipping, payment, and promotion configuration.
- Order visibility and operational follow-up after checkout.
- Idempotent operator-run catalog migrations that preserve commerce references while correcting product identity.

Out of scope:

- Custom admin UI extensions beyond Medusa Admin defaults.
- Warehouse operations details outside Medusa stock/fulfillment state.
- Accounting, ERP, and shipment-carrier integrations.

Deferred decisions:

- Exact admin roles/permissions beyond Medusa defaults.
- Launch payment provider selection per market.
- Whether order fulfillment/refund/return flows need separate dedicated flow documents before implementation.

## 3. Actors and Permissions

| Actor | Permissions | Authority source |
|---|---|---|
| Admin user | Manage products, prices, regions, shipping, payments, promotions, orders according to assigned admin role | Medusa Admin authentication/authorization |
| Storefront visitor/customer | No admin access; consumes published state only through Store API | Medusa Store API publishable key/session |
| Medusa backend | Enforces admin/store API boundaries and persists commerce state | Medusa modules/workflows/database |
| Trusted operator | Run reviewed Medusa execution scripts against the configured database; cannot bypass referential-safety checks | Deployment/runtime access + Medusa execution context |

## 4. Diagrams

### User flow

```mermaid
flowchart TD
  Start[Manager opens Medusa Admin] --> Auth{Authenticated?}
  Auth -->|no| Login[Log in through admin auth]
  Login --> Auth
  Auth -->|yes| Dashboard[Admin dashboard]
  Dashboard --> ChangeType{Change type}
  ChangeType -->|Catalog| Catalog[Create/update product, variant, category, price, inventory, sales channel]
  ChangeType -->|Translations| Translations[Edit supported locales and translated product content]
  ChangeType -->|Commerce settings| Settings[Update region, shipping, payment, promotion]
  ChangeType -->|Order operations| Orders[View/process order]
  Catalog --> Publish[Persist in Medusa]
  Translations --> PublishTranslations[Persist translation records in Medusa]
  Settings --> Publish
  Publish --> NotifyCatalog[Emit catalog:published]
  PublishTranslations --> NotifyLocalization[Emit catalog:translation-published]
  Publish --> NotifyCheckout[Emit commerce:settings-updated]
  Orders --> OrderState[Update operational order state in Medusa]
  Migration[Trusted operator runs launch catalog correction] --> Legacy{Legacy purple or sun-chain exists?}
  Legacy -->|no| Canonical{Canonical amethyst or lagoon exists?}
  Canonical -->|yes| UpdateCanonical[Update canonical product idempotently]
  Canonical -->|no| CreateCanonical[Create missing canonical product]
  Legacy -->|yes| Duplicate{Canonical duplicate also exists?}
  Duplicate -->|no| RemapLegacy[Remap legacy product ID to canonical identity]
  Duplicate -->|yes| Referenced{Duplicate has cart or order references?}
  Referenced -->|no| DeleteDuplicate[Delete redundant duplicate]
  Referenced -->|yes| ArchiveDuplicate[Unpublish and move duplicate to archived handle]
  DeleteDuplicate --> RemapLegacy
  ArchiveDuplicate --> RemapLegacy
  RemapLegacy --> NotifyCatalog
  UpdateCanonical --> NotifyCatalog
  CreateCanonical --> NotifyCatalog
```

### State machine

```mermaid
stateDiagram-v2
  [*] --> Unauthenticated
  Unauthenticated --> Authenticated: valid admin login
  Authenticated --> EditingCatalog: admin edits product/catalog data
  Authenticated --> EditingTranslations: admin edits localized product content
  Authenticated --> EditingSettings: admin edits commerce settings
  Authenticated --> ManagingOrders: admin opens order management
  EditingCatalog --> Published: Medusa persists publishable catalog state
  EditingCatalog --> CatalogSaveRejected: validation failure, stale edit, or auth expiry
  EditingTranslations --> TranslationsPublished: Medusa persists translation records
  EditingTranslations --> TranslationSaveRejected: invalid locale, stale edit, or auth expiry
  EditingSettings --> SettingsActive: Medusa persists active commerce settings
  EditingSettings --> SettingsRejected: validation failure or auth expiry
  ManagingOrders --> OrderUpdated: admin updates operational order state
  ManagingOrders --> OrderUpdateRejected: illegal transition or stale order state
  Published --> Authenticated
  TranslationsPublished --> Authenticated
  SettingsActive --> Authenticated
  OrderUpdated --> Authenticated
  CatalogSaveRejected --> Authenticated
  TranslationSaveRejected --> Authenticated
  SettingsRejected --> Authenticated
  OrderUpdateRejected --> Authenticated
  Authenticated --> Unauthenticated: logout/session expires
  [*] --> CatalogMigrationResolving: trusted operator executes migration
  CatalogMigrationResolving --> CanonicalUpdated: canonical product exists without legacy product
  CatalogMigrationResolving --> LegacyRemapped: legacy product exists without duplicate
  CatalogMigrationResolving --> DuplicateDeleting: duplicate has no cart/order references
  CatalogMigrationResolving --> DuplicateArchiving: duplicate has commerce references
  CatalogMigrationResolving --> CanonicalCreated: neither identity exists
  DuplicateDeleting --> LegacyRemapped: delete duplicate then remap legacy ID
  DuplicateArchiving --> LegacyRemapped: unpublish/archive duplicate then remap legacy ID
  CanonicalUpdated --> [*]
  CanonicalCreated --> [*]
  LegacyRemapped --> [*]
```

### Data/event flow

```mermaid
flowchart LR
  Manager[Admin user] --> AdminUI[Medusa Admin]
  AdminUI --> AdminAPI[Medusa Admin API]
  AdminAPI --> Backend[Medusa backend]
  Backend --> DB[(PostgreSQL commerce state)]
  DB --> Backend
  Backend --> CatalogEvent[catalog:published]
  Backend --> TranslationEvent[catalog:translation-published]
  Backend --> SettingsEvent[commerce:settings-updated]
  Checkout[Cart and Checkout] --> OrderEvent[order:placed]
  OrderEvent --> Backend
  CatalogEvent --> Catalog[Catalog Browsing]
  CatalogEvent --> Localization[Catalog Localization]
  TranslationEvent --> Localization
  SettingsEvent --> Cart[Cart and Checkout]
```

## 5. State and Projections

Authoritative state:

- Admin users, products, categories, variants, prices, price lists, regions, tax regions, sales channels, stock locations, inventory, shipping options, payment providers, promotions, customers, carts, orders, fulfillments, returns/refunds are Medusa-owned.
- PostgreSQL is the durable store configured through Medusa.
- During launch-collection correction, the legacy product IDs (`purple`, `sun-chain`) are authoritative predecessors for Amethyst and Lagoon because reusing them preserves cart/order references.

Admin projection:

- Medusa Admin dashboard views over backend state.
- Forms for editing commerce records.
- Order management screens.

Storefront projection:

- Storefront receives only Store API-visible published data; it must not read admin-only state directly.

## 6. Events/Actions

| Direction | Name | Target flow | Payload | Allowed when | Reject reason |
|---|---|---|---|---|---|
| Outgoing | `catalog:published` | Catalog Browsing | `{ productIds?, categoryIds?, regionIds?, salesChannelIds? }` | Authenticated admin persists publishable catalog/product/price/inventory/sales-channel changes | Admin auth failure, validation failure, unpublished/non-storefront-visible state |
| Outgoing | `catalog:published` | Catalog Localization | `{ productIds?, categoryIds?, regionIds?, salesChannelIds? }` | Authenticated admin persists publishable source product content | Admin auth failure, validation failure, unpublished/non-storefront-visible state |
| Outgoing | `catalog:translation-published` | Catalog Localization | `{ productIds, locales }` | Authenticated admin saves translations for supported storefront locales | Admin auth failure, validation failure, unsupported locale mapping, conflicting translation state |
| Outgoing | `commerce:settings-updated` | Cart and Checkout | `{ regionIds?, shippingOptionIds?, paymentProviderIds?, priceListIds? }` | Authenticated admin persists checkout-affecting settings | Admin auth failure, validation failure, provider/configuration error |
| Incoming | `order:placed` | Admin Operations | `{ orderId, cartId, customerId? }` | Medusa checkout creates an order | Not applicable to admin; absent if checkout fails |
| Internal | `admin:login` | None | `{ email }` | Credentials/session accepted by Medusa | Invalid credentials/session |
| Internal | `admin:catalog-saved` | None | `{ entityType, entityIds }` | Admin role can edit entity and validation passes | Forbidden, invalid schema, conflicting state |
| Internal | `admin:translation-saved` | None | `{ productIds, locales }` | Admin role can edit translations and locale configuration is valid | Forbidden, invalid locale, missing source product, conflicting translation state |
| Internal | `admin:catalog-migration-run` | None | `{ mappings: [{ oldHandle, newHandle }], dryRun?: false }` | Trusted operator runs the reviewed script in Medusa execution context | Missing prerequisites, unsafe duplicate references, or unresolved handle collision |
| Internal | `admin:order-updated` | None | `{ orderId, operation }` | Admin role can perform operation and order is in a legal state | Forbidden, stale order state, invalid transition |

## 7. Edge Cases

- Admin session expires while editing: save must be rejected; admin reauthenticates before retry.
- Product is published without valid variant/pricing for a storefront region: catalog flow must not expose it as purchasable until Medusa returns valid sellable data.
- Shipping/payment setting changes while a shopper is checking out: cart flow revalidates before mutation/completion.
- Order is placed while admin order list is open: admin projection refresh/polling/manual reload must reveal the new order before operational action.
- Two admins edit the same entity: Medusa validation/state wins; stale admin forms must not overwrite newer authoritative state silently.
- Admin attempts an illegal order transition: reject through Medusa; do not invent storefront-side compensating state.
- Admin publishes a product before RU/EN translations are complete: source product may be sellable, but localization flow must decide whether storefront shows fallback content or release QA blocks publication.
- Admin saves translations for a locale that storefront does not route (`ru`/`en` only in v1): Medusa may store the translation, but storefront ignores it until routing is expanded.
- Both legacy and canonical handles exist: prefer the legacy product ID, delete the canonical duplicate only when it has no cart or order references, then remap the legacy product.
- Canonical duplicate has cart or order references: do not delete it; unpublish it and move it to an archived unique handle before remapping the legacy product to the canonical handle.
- Only the legacy handle exists: update that product, variant, prices, translations, and metadata in place.
- Only the canonical handle exists: update it idempotently; do not create another product.
- Neither handle exists: create the canonical product once.
- Re-running after any completed or partial branch converges to one published canonical product and never recreates a redundant duplicate.

## 8. Side Effects

- Persist commerce configuration and translation records in Medusa/PostgreSQL.
- Storefront catalog, localization, and checkout projections change after the next Store API read/revalidation.
- Orders created by checkout become visible in Medusa Admin.
- Catalog correction preserves the legacy product/variant identity where possible, deletes only unreferenced duplicates, and hides referenced duplicates from Store API visibility.
- Future provider integrations may create side effects with payment, storage, search, monitoring, or fulfillment systems; those require dedicated integration flows before implementation.

## 9. Schemas Touched

Expected implementation/configuration files when custom admin behavior is built:

- `backend/apps/backend/medusa-config.ts` for modules/providers/configuration.
- `backend/apps/backend/src/api/admin/**` for custom admin routes.
- `backend/apps/backend/src/admin/**` for admin extensions.
- Medusa modules/workflows/subscribers under `backend/apps/backend/src/**` if custom commerce operations are added.

Current files that inform the flow:

- The placeholder custom admin route (`api/admin/custom/route.ts`) has been removed; no Sunluk-specific custom admin HTTP routes exist yet.
- `backend/apps/backend/src/migration-scripts/initial-data-seed.ts` seeds initial admin-managed commerce data.
- `backend/apps/backend/medusa-config.ts` configures Medusa backend environment and HTTP boundaries.
- `backend/apps/backend/src/migration-scripts/update-product-cards.ts` performs the one-time, idempotent launch-collection catalog migration through Medusa execution context.
- The launch correction maps `purple` to `amethyst` and `sun-chain` to `lagoon`; the seed continues to create only canonical handles on fresh databases.

## 10. Targeted Tests

| Layer | Behavior | File | Status |
|---|---|---|---|
| Backend integration | Custom admin routes require admin authorization before mutating state | To add when custom admin routes are implemented | Pending implementation |
| Backend integration | Catalog/config changes are visible through Store API only when published/sellable | To add when storefront catalog integration is implemented | Pending implementation |
| Backend integration | Checkout-affecting setting changes force cart/checkout revalidation | To add when checkout integration is implemented | Pending implementation |
| Backend migration smoke | Launch-collection update is rerunnable, preserves mapped product IDs, and exposes six published products without legacy handles | `backend/apps/backend/src/migration-scripts/update-product-cards.ts` | Passed 2026-07-15 |
| Backend migration smoke | Existing Purple and Sun Chain IDs become Amethyst and Lagoon; redundant unreferenced canonical duplicates are removed | `backend/apps/backend/src/migration-scripts/update-product-cards.ts` | Passed 2026-07-15 |
| Backend migration safety | A duplicate with cart/order references is archived and unpublished instead of deleted; rerun remains idempotent | `backend/apps/backend/src/migration-scripts/update-product-cards.ts` | Passed 2026-07-15 |

## 11. Implementation Plan

1. Use Medusa Admin defaults for baseline admin operations.
2. Add custom admin routes/extensions only when a concrete Sunluk-specific operation cannot be represented by Medusa defaults.
3. Keep product/cart/order/payment logic in Medusa modules, workflows, subscribers, and providers.
4. Add backend integration tests for every custom admin mutation before exposing it to storefront flows.
5. Correct the launch migration mappings to `purple` -> `amethyst` and `sun-chain` -> `lagoon`, preserving legacy IDs and converging duplicate states safely.

## 12. Implementation Trace

Current status: partial. Default Medusa Admin and its Sunluk extensions remain active; the corrected one-time product-card migration reuses existing Purple and Sun Chain records for Amethyst and Lagoon and safely converges redundant duplicate states.

Flow review: APPROVED 2026-07-15. Identity precedence, referential safety, duplicate convergence, rerun behavior, and validation paths are explicit with no unresolved blocker.


Validation:

- `npx tsc --noEmit` in `backend/apps/backend` completed successfully.
- `npx medusa exec ./src/migration-scripts/update-product-cards.ts` completed successfully twice against the local database.
- Store API returned all six launch products with localized copy/metadata and no legacy handles.
- Corrected migration completed twice. `prod_01KXD77RCZR088H58YSG2BEEK3` now owns `amethyst`; `prod_01KXDBBK6V5TXA74QWR0XXH0TY` now owns `lagoon`; redundant canonical duplicates and synthetic test data were removed; the pre-existing Purple cart reference remains valid; Store API exposes no `purple`, `sun-chain`, or archived duplicate handle.

## 13. Open Questions

- What admin roles are required for Sunluk launch beyond Medusa defaults?
- Which launch markets must be configured first?
- Which payment providers are required for launch per market?
- Should publication be blocked when either RU or EN translation is missing, or is source-language fallback acceptable during rollout?
- Should fulfillment, refunds, returns, and order transfer each receive dedicated flows before implementation?

## 14. Review Checklist

- [x] Admin/storefront permission boundary is explicit.
- [x] Cross-flow `catalog:published`, `catalog:translation-published`, `commerce:settings-updated`, and `order:placed` are declared.
- [x] Medusa remains the authority for commerce-critical state and translated product content.
- [x] Admin save rejection paths are represented for catalog, translations, settings, and orders.
- [x] Translation publication policy is surfaced as an open question instead of silently assumed.
- [x] Unsupported storefront locales remain ignored until routing explicitly enables them.
- [x] Custom provider/integration decisions are open questions, not silently assumed.
- [x] Catalog migration identity precedence and duplicate deletion/archive rules are explicit.
