# Analytics Consent Flow

## 1. Intent

Let storefront visitors explicitly accept or reject optional Yandex Metrika analytics before counter `111719197` loads, preserve that choice across visits, and withdraw or change it later.

Success criteria:

- No Yandex script, counter initialization, page hit, Webvisor recording, or tracking cookie is created before consent is granted.
- Accept and reject actions are equally available from the first-visit banner.
- Consent copy names Yandex Metrika, Webvisor/session replay, the analytics purpose, and the existing privacy policy before acceptance.
- The visitor can reopen settings from the site footer and withdraw previously granted consent.
- Granted consent enables one initial hit and one hit per subsequent Next.js route change.
- Withdrawing consent stops the counter, removes accessible Yandex cookies/storage, and prevents further hits.
- With granted consent, each successful primary product add emits one `add_to_cart` JavaScript goal and one Yandex ecommerce `add` payload containing product identity, name, price, currency, and quantity.
- Browsing, cart, checkout, and authentication remain available regardless of the analytics choice.

## 2. Scope

In scope:

- A localized analytics-consent banner and privacy-policy link.
- A factual privacy-policy disclosure naming Yandex Metrika, Webvisor, analytics purpose, browser data, and the in-app withdrawal path.
- Browser-local persistence of `granted` or `denied` consent.
- A footer control that reopens consent settings.
- Consent-gated loading and lifecycle of Yandex Metrika counter `111719197`.
- SPA page hits after consent.
- Webvisor, click map, link tracking, accurate bounce tracking, and the `dataLayer` ecommerce container setting supplied for this counter.

Out of scope:

- Product-view, checkout, order, and revenue ecommerce events.
- Advertising cookies, personalization, user identity, or server-side analytics.
- A general consent-management platform or multiple cookie categories.
- Retrospective deletion of data already received by Yandex before consent withdrawal.

Deferred decisions: add further ecommerce events only when their event contracts are explicitly requested.

## 3. Actors and Permissions

| Actor | Permissions | Authority source |
|---|---|---|
| Visitor | Accept, reject, reopen, or change optional analytics consent; browse and purchase in every consent state | Explicit storefront action persisted in the visitor browser |
| Storefront | Load and call Metrika only while consent is granted; forward a successful primary cart add without changing commerce state; cannot infer consent from continued browsing | Persisted consent value, current in-memory choice, and Medusa-accepted cart mutation |
| Yandex Metrika | Receive page analytics and consented product-add telemetry only after consent is granted | Counter `111719197` client integration |

## 4. Diagrams

### User flow

```mermaid
flowchart TD
  Start[Storefront hydrates] --> Stored{Stored analytics choice?}
  Stored -->|none or unreadable| Prompt[Show consent banner]
  Stored -->|denied| Disabled[Keep analytics disabled]
  Stored -->|granted| Enable[Load and initialize Metrika]
  Prompt --> Choice{Visitor choice}
  Choice -->|accept| Enable
  Choice -->|reject| Disabled
  Enable --> Hit[Send current page hit]
  Hit --> Enabled[Remain enabled]
  Enabled --> Activity{Observed event?}
  Activity -->|distinct route| HitNext[Send one SPA hit]
  HitNext --> Enabled
  Activity -->|successful primary cart add| AddEvent[Push ecommerce add and reach add_to_cart goal]
  AddEvent --> Enabled
  Disabled --> Browse[Browsing and checkout remain available]
  Enabled --> Settings{Open footer settings?}
  Disabled --> Settings
  Settings -->|keep or grant| Enable
  Settings -->|withdraw or reject| Revoke[Destroy counter and clear accessible Yandex storage]
  Revoke --> Disabled
```

### State machine

```mermaid
stateDiagram-v2
  [*] --> Unknown
  Unknown --> Granted: visitor accepts
  Unknown --> Denied: visitor rejects
  Granted --> Granted: route change sends one hit
  Granted --> Granted: successful primary cart add sends one ecommerce add and one add_to_cart goal
  Granted --> Denied: visitor withdraws
  Denied --> Granted: visitor changes choice
  Denied --> Denied: route change sends nothing
  Denied --> Denied: successful cart add sends no telemetry
  Unknown --> Unknown: storage unavailable before choice
```

### Data flow

```mermaid
flowchart LR
  Action[Visitor consent action] --> Controller[Analytics consent client component]
  Controller --> Choice[(Browser-local consent value)]
  Controller --> Projection[Localized banner/settings projection]
  Choice --> Gate{Granted?}
  Route[Next.js route URL] --> Gate
  CartAdd[Product Add-ons cart:item-added] --> Gate
  Gate -->|no| Block[No tag.js, dataLayer push, or ym calls]
  Gate -->|yes| Tag[Yandex tag.js and counter 111719197]
  Gate -->|yes, cart item added| ProductTelemetry[ecommerce.add plus add_to_cart goal]
  Tag --> Metrika[Yandex Metrika]
  ProductTelemetry --> Metrika
  Withdraw[Withdrawal] --> Destroy[destruct plus accessible cookie/storage cleanup]
  Destroy --> Block
```

## 5. State and Projections

Authoritative state:

- Browser key `sunluk_analytics_consent` contains only `granted` or `denied`.
- Missing, malformed, or unreadable storage is `unknown`; it never counts as granted consent.
- The current in-memory choice applies immediately even if browser storage rejects the write.

Projection:

- `unknown`: show the localized banner with accept, reject, and privacy-policy actions; analytics is disabled.
- `granted`: hide the banner, load the counter once, initialize with `defer: true`, and emit page hits.
- `denied`: hide the first-visit banner and keep analytics disabled.
- Footer settings action: reopen the same choice UI in any state; it does not block browsing.

## 6. Events/Actions

| Direction | Name | Target flow | Payload | Allowed when | Reject reason |
|---|---|---|---|---|---|
| Internal | `analytics:consent-accepted` | None | `{ value: "granted" }` | Consent UI is available | None |
| Internal | `analytics:consent-rejected` | None | `{ value: "denied" }` | Consent UI is available | None |
| Internal | `analytics:settings-opened` | None | `{}` | Footer is interactive | None |
| Internal | `analytics:route-hit` | None | `{ url, title, referer? }` | Consent is granted and counter is initialized | Consent absent/denied or URL already sent |
| Incoming | `cart:item-added` | Analytics Consent | `{ productId, sku?, name, price, currencyCode, quantity }` | Medusa accepted the primary product mutation and consent is granted | Consent absent/denied, primary mutation rejected, linked packaging mutation, invalid price/currency, or duplicate callback |
| Internal | `analytics:consent-withdrawn` | None | `{ value: "denied" }` | Previously granted consent is changed to denied | Counter not initialized is a safe no-op |

Cross-flow boundary: Product Add-ons emits `cart:item-added` after the primary Medusa mutation succeeds. Analytics observes that result, gates telemetry by consent, and never alters navigation, cart, checkout, or authentication state.

## 7. Edge Cases

- First visit or malformed stored value: treat as unknown, show the banner, and make no Yandex request.
- Storage read/write is unavailable: keep the safe default before choice; apply the visitor choice for the current page in memory and ask again on a future visit.
- React development remount or repeated render: inject and initialize the counter at most once and avoid duplicate hits for the same URL.
- Route changes before consent: send nothing; acceptance later sends the current URL once.
- Consent is withdrawn after initialization: call `ym(111719197, "destruct")`, clear accessible Yandex cookies plus `_ym*` browser storage, and block later hits. Already transmitted data cannot be recalled.
- Consent changes from denied to granted: initialize once and send the current page hit.
- A second tab has stale in-memory consent: a browser `storage` event applies the newer persisted choice and gates or revokes analytics in that tab.
- The counter-bound Yandex loader may consume and remove its temporary `window.ym` and `window.dataLayer` globals after initialization. Storefront retains the original command function and ecommerce array references; later `hit`, `reachGoal`, and ecommerce pushes use those observed references instead of recreating disconnected globals.
- Yandex script fails to load: storefront behavior remains available; do not retry beyond normal navigation/reload behavior or misreport consent as denied.
- A primary cart mutation fails: emit neither ecommerce data nor `add_to_cart`; a later successful retry may emit once.
- A linked packaging mutation succeeds or fails: do not emit another product-add event; the primary product was already reported once.
- Product SKU is absent: use the stable Medusa product id for ecommerce `id`; never omit both identifiers.
- Currency is normalized to uppercase ISO 4217 and Medusa's calculated amount is forwarded unchanged; storefront analytics does not recalculate price.
- Consent is denied or withdrawn: the cart mutation still succeeds, but no ecommerce container or goal call is created.
- The privacy policy remains reachable at `/{locale}/info#privacy` without granting consent.
- No `<noscript>` tracking pixel is rendered because it would bypass interactive consent.

## 8. Side Effects

- After grant, initialize `window.dataLayer`, create the global `ym` queue, retain both references, inject the counter-bound `https://mc.yandex.ru/metrika/tag.js?id=111719197` loader, initialize counter `111719197` with `defer: true`, and send the current page hit.
- While granted, send one `hit` call for each distinct client-side route URL.
- After a consented primary cart mutation succeeds, push one `ecommerce.add.products` item through the retained ecommerce array and call `reachGoal` through the retained command function for counter `111719197` and target `add_to_cart`.
- Product telemetry contains no customer identity: ecommerce `id` uses SKU with product-id fallback, plus name, Medusa-calculated price, quantity, and uppercase currency code.
- After withdrawal, destroy the counter instance, remove accessible Yandex cookies/storage, and stop future calls.
- Render localized consent controls without blocking commerce flows.

## 9. Schemas Touched

- `storefront/src/components/analytics/analytics-consent.tsx`: consent state, persistence, footer settings control, counter lifecycle, and SPA hit gating.
- `storefront/src/components/product/ProductInfoBlock.tsx`: pass existing Medusa product identity/title into the add-to-cart seam.
- `storefront/src/components/product/VariantSelector.tsx`: emit telemetry once after the successful primary mutation and before any linked packaging mutation.
- `storefront/src/app/[locale]/layout.tsx`: mount the site-wide analytics consent controller.
- `storefront/src/components/landing/SiteFooter.tsx`: expose the footer settings control.
- `storefront/messages/ru.json`: Russian consent labels and explanatory copy.
- `storefront/messages/en.json`: English consent labels and explanatory copy.
- `storefront/messages/info/ru.json`: Russian privacy-policy disclosure for Yandex Metrika and withdrawal.
- `storefront/messages/info/en.json`: English privacy-policy disclosure for Yandex Metrika and withdrawal.
- `storefront/src/lib/__tests__/analytics-consent.test.tsx`: focused observable consent behavior.
- `storefront/src/lib/__tests__/cart-packaging.test.tsx`: focused successful, rejected, and linked-packaging telemetry behavior.
- `storefront/src/lib/__tests__/info-sections.test.ts`: bilingual privacy-policy structure count.

## 10. Targeted Tests

| Layer | Behavior | File | Status |
|---|---|---|---|
| Storefront component | Unknown consent shows provider, purpose, Webvisor disclosure, privacy link, and controls without a Metrika request | `storefront/src/lib/__tests__/analytics-consent.test.tsx` | Passed 2026-08-24 |
| Storefront component | Accept persists grant, loads once, and sends current route once | `storefront/src/lib/__tests__/analytics-consent.test.tsx` | Passed 2026-08-24 |
| Storefront component | Reject persists denial and route changes remain untracked | `storefront/src/lib/__tests__/analytics-consent.test.tsx` | Passed 2026-08-24 |
| Storefront component | Granted initialization loads the counter-bound tag and retains the observed command queue/ecommerce array references for later `hit`, `reachGoal`, and ecommerce pushes even if Yandex removes their globals | `storefront/src/lib/__tests__/analytics-consent.test.tsx` | Passed 2026-08-28 |
| Storefront integration | Successful primary add emits exactly one ecommerce product payload and one `add_to_cart` goal with SKU/product id, name, Medusa price, currency, and quantity | `storefront/src/lib/__tests__/cart-packaging.test.tsx` | Passed 2026-08-28 |
| Storefront integration | Rejected primary add and linked packaging add emit no extra telemetry; denied consent leaves commerce successful and untracked | `storefront/src/lib/__tests__/cart-packaging.test.tsx` | Passed 2026-08-28 |
| Browser smoke | Production requests `mc.yandex.ru` only after accept and stops after withdrawal | `https://sunluk.ru` | Passed 2026-08-24 |

## 11. Implementation Plan

1. Add one client module containing the consent controller/banner and small footer settings control; use browser storage and a single custom reopen event instead of a global state dependency.
2. Mount the controller once in the locale layout and add the settings control to the existing shared footer.
3. Add informed localized banner copy, link the existing privacy-policy anchor, and extend the policy with the provider, Webvisor, purpose, browser data, and withdrawal path.
4. Add one focused component test file for pre-consent, accept, reject, SPA-hit, and withdrawal behavior.
5. Run storefront checks, browser smoke, and the existing Dokploy deployment path.
6. Use the counter-bound loader, retain the command/dataLayer references observed by Yandex, and export one consent-aware add-to-cart telemetry helper from the existing analytics module.
7. Call it once at the successful primary product seam and cover success, rejection, packaging, and denied-consent paths.

## 12. Implementation Trace

Current status: Complete locally; product-add telemetry is implemented and verified against counter `111719197`. Deployment remains outside this change.

Implementation files:

- `storefront/src/components/analytics/analytics-consent.tsx`
- `storefront/src/components/product/ProductInfoBlock.tsx`
- `storefront/src/components/product/VariantSelector.tsx`
- `storefront/src/app/[locale]/layout.tsx`
- `storefront/src/components/landing/SiteFooter.tsx`
- `storefront/messages/ru.json`
- `storefront/messages/en.json`
- `storefront/messages/info/ru.json`
- `storefront/messages/info/en.json`
- `flows/ARCHITECTURE.md`

Test files:

- `storefront/src/lib/__tests__/analytics-consent.test.tsx`
- `storefront/src/lib/__tests__/cart-packaging.test.tsx`
- `storefront/src/lib/__tests__/info-sections.test.ts`

Validation:

- `npm run lint --prefix storefront` passed with zero warnings and errors.
- `npm run build --prefix storefront` completed successfully.
- `npm run test --prefix storefront` passed 22 files / 143 tests.
- `npm run lint --prefix backend` passed the global lint gate.
- Local production-build browser smoke confirmed zero Yandex requests before consent, tag loading after acceptance, footer withdrawal, and no later route hit.
- GitHub Actions Storefront CI run `32734085520` passed for deployment commit `afb42e5`.
- Production browser smoke at `https://sunluk.ru` confirmed zero Yandex requests before consent; after acceptance `tag.js?id=111719197` and `watch/111719197` returned HTTP 200; withdrawal removed the counter and a later route change made no Yandex request.
- 2026-08-28 focused tests: `npm test -- --run src/lib/__tests__/analytics-consent.test.tsx src/lib/__tests__/cart-packaging.test.tsx` passed 2 files / 20 tests.
- 2026-08-28 production build with the deployed Medusa endpoint and publishable key passed compilation, TypeScript, and page generation.
- 2026-08-28 local production browser smoke used the real Medusa Store API through a CORS-only test proxy: primary Lagoon quantity 2 and linked packaging both returned HTTP 200; Metrika sent one ecommerce request containing `{ id: "LAGOON-CHAIN", name: "Lagoon", price: 54, quantity: 2, currencyCode: "EUR" }` and one goal request with `page-url=goal://172.18.0.1/add_to_cart`.
- 2026-08-28 final global storefront/backend lint passed with zero errors after the retained-reference correction.

## 13. Open Questions

None. Product-add telemetry is now explicitly requested; product-view, checkout, order, revenue, advertising, identity, and server-side analytics remain out of scope.

## 14. Review Checklist

- [x] Unknown, granted, denied, reopened, and withdrawn states are explicit.
- [x] Pre-consent and rejected paths prohibit all Yandex loading and hits.
- [x] Duplicate initialization, SPA routing, storage failure, stale tabs, script failure, and withdrawal are covered.
- [x] Withdrawal limitations and accessible storage cleanup are explicit.
- [x] Successful primary add, rejected add, linked packaging, missing SKU, currency normalization, duplicate prevention, and denied-consent behavior are explicit.
- [x] The counter-bound loader and retained command/dataLayer references are explicit; disconnected replacement globals are forbidden.
- [x] Browser authority, informed disclosure, localization, privacy policy, schemas, tests, and deployment smoke are named.
- [x] The single Product Add-ons → Analytics Consent boundary is declared and does not transfer commerce authority.

Flow review v2 (2026-08-28): **APPROVED**. Consent-gated product telemetry has explicit success, rejection, linked-packaging, duplicate, schema, test, and cross-flow contracts; no blockers remain.

Flow review v3 (2026-08-28): **APPROVED**. The generic JavaScript API loader, persistent `ym` queue, consent gate, exact product payload, failure paths, tests, and cross-flow contracts are explicit; no blockers remain.

Flow review v4 (2026-08-28): **APPROVED**. Runtime-observed removal of temporary globals is handled by retaining the exact command queue and ecommerce array consumed by Yandex; tests and failure boundaries remain explicit.

Flow review v5 (2026-08-28): **APPROVED**. Live smoke proved the counter-bound loader initializes counter `111719197`; retaining its consumed command/dataLayer references provides the post-load API needed by goal and ecommerce events.

Flow-code sync v2 (2026-08-28): **IN SYNC**. The retained Yandex command/dataLayer references, consent gate, primary-add seam, exact ecommerce payload, `add_to_cart` goal, rejection/packaging behavior, focused tests, build, and browser network smoke match Sections 4–12.
