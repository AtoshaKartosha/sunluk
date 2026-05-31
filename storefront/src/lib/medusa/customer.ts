import Medusa from "@medusajs/js-sdk";
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
export const COOKIE_NAME = "medusa_auth_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds
const MIGRATION_KEY = "sunluk_token_migrated";
export const baseUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000";
export const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrderSummary {
  id: string;
  display_id?: number | null;
  status: string;
  payment_status: string;
  fulfillment_status: string | null;
  total: number | null;
  currency_code: string | null;
  item_total: number | null;
  created_at: string | null;
}

// ---------------------------------------------------------------------------
// CookieJwtStorage — local interface matching the SDK's CustomStorage shape
// ---------------------------------------------------------------------------
// `CustomStorage` is not re-exported from @medusajs/js-sdk, so we declare
// a structurally-compatible local interface for the `storage` config field.

export interface CookieJwtStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

// ---------------------------------------------------------------------------
// CustomerStorage — implements CookieJwtStorage for client-side cookie I/O
// ---------------------------------------------------------------------------

export class CustomerStorage implements CookieJwtStorage {
  getItem(key: string): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${key}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  setItem(key: string, value: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  }

  removeItem(key: string): void {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
  }
}

// ---------------------------------------------------------------------------
// Plain cookie helpers (for direct client use, outside the SDK storage)
// ---------------------------------------------------------------------------

export function getAuthCookie(): string | null {
  return new CustomerStorage().getItem(COOKIE_NAME);
}

export function setAuthCookie(token: string): void {
  new CustomerStorage().setItem(COOKIE_NAME, token);
}

export function removeAuthCookie(): void {
  new CustomerStorage().removeItem(COOKIE_NAME);
}

// ---------------------------------------------------------------------------
// Client-side SDK helper
// ---------------------------------------------------------------------------

let _clientSdk: Medusa | null = null;

export function getClientMedusaClient(): Medusa {
  if (!_clientSdk) {
    // Migrate any existing token from localStorage into the cookie
    // (the SDK may have stored it there from a prior integration).
    if (
      typeof localStorage !== "undefined" &&
      !localStorage.getItem(MIGRATION_KEY)
    ) {
      const legacyToken = localStorage.getItem(COOKIE_NAME);
      if (legacyToken) {
        setAuthCookie(legacyToken);
        localStorage.removeItem(COOKIE_NAME);
      }
      localStorage.setItem(MIGRATION_KEY, "1");
    }

    _clientSdk = new Medusa({
      baseUrl,
      publishableKey,
      auth: {
        type: "jwt",
        jwtTokenStorageKey: COOKIE_NAME,
        jwtTokenStorageMethod: "custom",
        storage: new CustomerStorage(),
      },
      debug: process.env.NODE_ENV === "development",
    });
  }
  return _clientSdk;
}

// ---------------------------------------------------------------------------
// Auth action helpers
// ---------------------------------------------------------------------------

/**
 * Log in a customer with email and password.
 *
 * On success the SDK stores the JWT in the `medusa_auth_token` cookie
 * via CustomerStorage. Subsequent calls automatically attach the token.
 *
 * Returns `{ success: true, token }` or `{ success: false, error }`.
 */
export async function loginCustomer(
  email: string,
  password: string,
): Promise<
  { success: true; token: string } | { success: false; error: string }
> {
  try {
    const sdk = getClientMedusaClient();
    const result = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    });

    // AuthLoginResponse = string | AuthRedirectResponse | AuthMfaRequiredResponse | AuthVerificationRequiredResponse
    if (typeof result !== "string") {
      const detail =
        "location" in result
          ? "Authentication requires redirect"
          : "Authentication requires additional verification";
      return { success: false, error: detail };
    }

    return { success: true, token: result };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Login failed";
    return { success: false, error: message };
  }
}

/**
 * Register a new customer.
 *
 * 1. Obtains a registration token via `sdk.auth.register`.
 * 2. Creates the customer profile with the registration token.
 * 3. Logs in so the JWT is stored in the cookie.
 *
 * Returns `{ success: true, token }` or `{ success: false, error }`.
 */
export async function registerCustomer(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<
  { success: true; token: string } | { success: false; error: string }
> {
  try {
    const sdk = getClientMedusaClient();

    // Step 1: get registration token
    const regResult = await sdk.auth.register("customer", "emailpass", {
      email,
      password,
    });

    if (typeof regResult !== "string") {
      return { success: false, error: "Registration failed. Please try again." };
    }

    // Step 2: create the customer profile using the registration token
    await sdk.store.customer.create(
      {
        email,
        first_name: firstName,
        last_name: lastName,
      },
      {},
      {
        Authorization: `Bearer ${regResult}`,
      },
    );

    // Step 3: log in to store the JWT in the cookie
    const loginResult = await sdk.auth.login("customer", "emailpass", {
      email,
      password,
    });

    if (typeof loginResult !== "string") {
      return {
        success: false,
        error: "Account created but login failed. Please sign in manually.",
      };
    }

    return { success: true, token: loginResult };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Registration failed";
    return { success: false, error: message };
  }
}

/**
 * Clear the JWT token and log out.
 */
export async function logoutCustomer(): Promise<void> {
  const sdk = getClientMedusaClient();
  await sdk.auth.logout();
}

export { loginCustomer as login, registerCustomer as register, logoutCustomer as logout };
