/**
 * Storage interface expected by the Medusa JS SDK for JWT token persistence.
 *
 * The upstream `CustomStorage` type is NOT currently re-exported from
 * `@medusajs/js-sdk`, so we declare a compatible local shape.
 */
export interface CookieJwtStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

const COOKIE_NAME = "medusa_auth_token";

/**
 * Cookie-based JWT storage for the Medusa JS SDK.
 *
 * Implements the CustomStorage interface expected by the SDK, persisting tokens
 * in browser cookies so both Client Components (via `document.cookie`) and
 * Server Components (via the `Cookie` request header) can access them.
 *
 * The cookie is deliberately NOT httpOnly — the client-side SDK reads it
 * to attach the JWT `Authorization` header to Store API calls.
 */
export class CookieStorage implements CookieJwtStorage {
  async getItem(key: string): Promise<string | null> {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${key}=([^;]*)`),
    );
    return match ? decodeURIComponent(match[1]) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
    if (window.location.protocol === "https:") {
      document.cookie += "; Secure";
    }
  }

  async removeItem(key: string): Promise<void> {
    if (typeof document === "undefined") return;
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax`;
  }
}

export { COOKIE_NAME };