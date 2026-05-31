import Medusa from "@medusajs/js-sdk";

const baseUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// Singleton — a single SDK instance is safe for server-side use.
// The internal Client handles fetch; no auth token is needed for store endpoints.
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
