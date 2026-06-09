import Medusa from "@medusajs/js-sdk";
import { cookies } from "next/headers";
import { OrderSummary, COOKIE_NAME, baseUrl, publishableKey } from "./customer";

/**
 * Read the `medusa_auth_token` cookie from the incoming request.
 * Safe to call in Server Components and Server Actions.
 */
export async function getServerAuthToken(): Promise<string | null> {
  try {
    const store = await cookies();
    return store.get(COOKIE_NAME)?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Create a **per-request** authenticated Medusa SDK pre-loaded with the
 * user's JWT. This MUST NOT be cached/singleton — the token is
 * request-scoped.
 */
export async function createServerAuthClient(): Promise<Medusa | null> {
  const token = await getServerAuthToken();
  if (!token) return null;

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

/**
 * Retrieve the currently authenticated customer's profile from the server.
 * Returns the raw Medusa customer object, or `null` if not authenticated.
 */
export async function getCustomer() {
  const sdk = await createServerAuthClient();
  if (!sdk) return null;
  try {
    const result = await sdk.store.customer.retrieve();
    return result.customer ?? null;
  } catch {
    return null;
  }
}

/**
 * Retrieve the authenticated customer's order history from the server.
 * Returns `{ orders, count }` or `null` on auth failure.
 */
export async function getCustomerOrders(
  limit?: number,
  offset?: number,
): Promise<{ orders: OrderSummary[]; count: number } | null> {
  const sdk = await createServerAuthClient();
  if (!sdk) return null;
  try {
    const { orders, count } = await sdk.store.order.list({
      fields:
        "id,display_id,status,payment_status,fulfillment_status," +
        "total,currency_code,item_total,created_at,*items",
      limit: limit ?? 10,
      offset: offset ?? 0,
    });
    return { orders: orders as OrderSummary[], count };
  } catch {
    return null;
  }
}

/**
 * Retrieve a single order by ID from the server.
 * Returns the raw Medusa order object, or `null` if not found / not authorized.
 */
export async function getCustomerOrder(orderId: string) {
  const sdk = await createServerAuthClient();
  if (!sdk) return null;
  try {
    const { order } = await sdk.store.order.retrieve(orderId, {
      fields:
        "id,display_id,status,payment_status,fulfillment_status," +
        "total,currency_code,item_total,subtotal,tax_total," +
        "shipping_total,discount_total,created_at," +
        "*items,*shipping_address,*billing_address",
    });
    return order ?? null;
  } catch {
    return null;
  }
}
