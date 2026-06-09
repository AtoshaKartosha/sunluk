import Medusa from "@medusajs/js-sdk";
import { CookieStorage, COOKIE_NAME } from "./medusa/cookie-storage";

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

// ---------------------------------------------------------------------------
// Authenticated client (client-side) — uses cookie-based JWT storage
// ---------------------------------------------------------------------------

let _authSdk: Medusa | null = null;

export function getAuthClient(): Medusa {
  if (!_authSdk) {
    _authSdk = new Medusa({
      baseUrl,
      publishableKey,
      auth: {
        type: "jwt",
        jwtTokenStorageKey: COOKIE_NAME,
        jwtTokenStorageMethod: "custom",
        storage: new CookieStorage(),
      },
      debug: process.env.NODE_ENV === "development",
    });
  }
  return _authSdk;
}

// ---------------------------------------------------------------------------
// Authenticated client (server-side) — pre-loads token from value
// ---------------------------------------------------------------------------

/**
 * Create a fresh authenticated Medusa client pre-loaded with the given JWT.
 *
 * Server Components / Server Actions should read the `medusa_auth_token`
 * cookie themselves and pass its value here. The SDK is NOT cached — it is
 * ephemeral per request, matching the request-scoped cookie.
 */
export async function createServerAuthClient(token: string): Promise<Medusa> {
  const sdk = new Medusa({
    baseUrl,
    publishableKey,
    auth: {
      type: "jwt",
      jwtTokenStorageKey: COOKIE_NAME,
      jwtTokenStorageMethod: "memory",
    },
    debug: process.env.NODE_ENV === "development",
  });
  await sdk.client.setToken(token);
  return sdk;
}
