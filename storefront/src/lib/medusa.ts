import Medusa from "@medusajs/js-sdk";

const baseUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// ---------------------------------------------------------------------------
// Public (non-auth) client — singleton safe for store endpoints
// ---------------------------------------------------------------------------

let _sdk: Medusa | null = null;

export function getMedusaClient(): Medusa {
  if (!_sdk) {
    _sdk = new Medusa({
      baseUrl,
      publishableKey,
      debug: process.env.NODE_ENV === "development",
    });
  }
  return _sdk;
}
// ---------------------------------------------------------------------------
// Per-request public client — locale-scoped, no singleton leak
// ---------------------------------------------------------------------------

/**
 * Create a fresh Medusa storefront client with the given locale header.
 *
 * Each call returns a new instance so that `x-medusa-locale` cannot leak
 * across concurrent requests.  Set `globalHeaders` because the SDK's
 * `setLocale()` method is a no-op in non-browser environments.
 */
export function getMedusaClientWithLocale(medusaLocale: string): Medusa {
  return new Medusa({
    baseUrl,
    publishableKey,
    globalHeaders: { "x-medusa-locale": medusaLocale },
    debug: process.env.NODE_ENV === "development",
  });
}
