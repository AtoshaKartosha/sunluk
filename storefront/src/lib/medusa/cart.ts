import { getMedusaClient, getMedusaClientWithLocale } from "../medusa";
import type { RegionResult } from "./regions";

const CART_ID_KEY = "sunluk_cart_id";

const CART_FIELDS =
  "id,region_id,customer_id,email,sales_channel_id,currency_code,total,subtotal,tax_total,discount_total,shipping_total,item_total,item_subtotal,item_tax_total,item_count,*items,*items.variant,*items.product,*region,*shipping_address,*billing_address,*shipping_methods";

// ---------------------------------------------------------------------------
// Cart ID persistence (localStorage)
// ---------------------------------------------------------------------------

/**
 * Read the stored cart id. Returns `null` on the server or when localStorage
 * is unavailable (e.g. private-mode Safari).
 */
export function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(CART_ID_KEY);
  } catch {
    return null;
  }
}

function storeCartId(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_ID_KEY, id);
  } catch {
    // Storage unavailable — cart is kept in memory only.
  }
}

/**
 * Drop the stored cart id (and the legacy `medusa_cart_id` key). Used on cart
 * completion and whenever a stored id turns out to be stale.
 */
export function clearCartId(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CART_ID_KEY);
    window.localStorage.removeItem("medusa_cart_id");
  } catch {
    // No-op.
  }
}

// ---------------------------------------------------------------------------
// Error detection
// ---------------------------------------------------------------------------

/**
 * Detect a "cart not found" / 404 response from an SDK cart call. Used to
 * decide when a stored cart id is stale and should be cleared + the cart
 * recreated for the region. Centralised here so every caller (initial fetch
 * and add/update/remove mutations) shares one definition.
 */
export function isCartNotFound(err: unknown): boolean {
  if (typeof err !== "object" || err == null) return false;
  const message = (err as Record<string, unknown>).message;
  if (typeof message !== "string") return false;
  return message.includes("404") || message.includes("not found");
}

// ---------------------------------------------------------------------------
// Cart API helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve the current cart from Medusa if a cart_id is stored locally,
 * validating that it still exists and is not completed. Returns `null` when
 * no valid cart exists (no stored id, 404, or completed cart); clears the
 * stale id in those cases.
 */
export async function getCart(medusaLocale?: string) {
  const cartId = getStoredCartId();
  if (!cartId) return null;

  try {
    const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
    const { cart } = await sdk.store.cart.retrieve(cartId, {
      fields: CART_FIELDS,
    });
    // Cart is completed (order placed) — clear it locally.
    if ((cart as Record<string, unknown>).completed_at) {
      clearCartId();
      return null;
    }
    return cart;
  } catch (err: unknown) {
    if (isCartNotFound(err)) clearCartId();
    return null;
  }
}

/**
 * Create a new cart for the given region, including its currency code, and
 * persist the id locally. Single creation path for the whole storefront.
 */
export async function createCart(region: RegionResult, medusaLocale?: string) {
  const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
  const { cart } = await sdk.store.cart.create(
    { region_id: region.regionId, currency_code: region.currencyCode },
    { fields: CART_FIELDS },
  );
  storeCartId(cart.id);
  return cart;
}

/**
 * Add a product variant to the cart. Optional `metadata` is forwarded to the
 * SDK (used to link add-on items to their parent line item).
 */
export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
  metadata?: Record<string, unknown>,
  medusaLocale?: string,
) {
  const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
  const { cart } = await sdk.store.cart.createLineItem(
    cartId,
    { variant_id: variantId, quantity, metadata },
    { fields: CART_FIELDS },
  );
  return cart;
}

/**
 * Update a line item's quantity.
 */
export async function updateLineItem(
  cartId: string,
  lineItemId: string,
  quantity: number,
  medusaLocale?: string,
) {
  const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
  const { cart } = await sdk.store.cart.updateLineItem(
    cartId,
    lineItemId,
    { quantity },
    { fields: CART_FIELDS },
  );
  return cart;
}

/**
 * Remove a line item from the cart. Re-fetches the cart afterwards to
 * guarantee a fully-populated projection for the UI regardless of what the
 * delete endpoint returns.
 */
export async function removeLineItem(cartId: string, lineItemId: string, medusaLocale?: string) {
  const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
  await sdk.store.cart.deleteLineItem(cartId, lineItemId, {
    fields: CART_FIELDS,
  });
  const { cart } = await sdk.store.cart.retrieve(cartId, {
    fields: CART_FIELDS,
  });
  return cart;
}

// ---------------------------------------------------------------------------
// Checkout API helpers
// ---------------------------------------------------------------------------

/**
 * Update cart details — email, shipping_address, billing_address, etc.
 */
export async function updateCart(cartId: string, data: Record<string, unknown>, medusaLocale?: string) {
  const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
  const { cart } = await sdk.store.cart.update(cartId, data, {
    fields: CART_FIELDS,
  });
  return cart;
}

/**
 * Fetch available shipping options for a cart.
 */
export async function getShippingOptions(cartId: string, medusaLocale?: string) {
  const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
    cart_id: cartId,
  });
  return shipping_options;
}

/**
 * Add a shipping method to the cart.
 */
export async function addShippingMethod(cartId: string, optionId: string, medusaLocale?: string) {
  const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
  const { cart } = await sdk.store.cart.addShippingMethod(
    cartId,
    { option_id: optionId },
    { fields: CART_FIELDS },
  );
  return cart;
}

/**
 * Create payment sessions for the cart using the default payment provider.
 * Uses `sdk.store.payment.initiatePaymentSession` which auto-creates a
 * payment collection if one does not yet exist on the cart.
 */
export async function createPaymentSessions(cartId: string, medusaLocale?: string) {
  const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
  const { cart } = await sdk.store.cart.retrieve(cartId, {
    fields: CART_FIELDS,
  });
  return sdk.store.payment.initiatePaymentSession(cart, {
    provider_id: "pp_system_default",
  });
}

/**
 * Complete the cart to create an order. Returns either
 * `{ type: "order", order }` on success or
 * `{ type: "cart", error, cart }` on failure.
 */
export async function completeCart(cartId: string, medusaLocale?: string) {
  const sdk = medusaLocale ? getMedusaClientWithLocale(medusaLocale) : getMedusaClient();
  return sdk.store.cart.complete(cartId);
}
