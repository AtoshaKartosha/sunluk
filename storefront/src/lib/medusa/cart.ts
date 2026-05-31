import { getMedusaClient } from "../medusa";

const CART_ID_KEY = "sunluk_cart_id";

const CART_FIELDS =
  "id,region_id,customer_id,email,sales_channel_id,currency_code,total,subtotal,tax_total,discount_total,shipping_total,*items,*region";

// ---------------------------------------------------------------------------
// Cart ID persistence (localStorage)
// ---------------------------------------------------------------------------

function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CART_ID_KEY);
}

function storeCartId(id: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_ID_KEY, id);
}

export function clearCartId(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CART_ID_KEY);
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/**
 * Retrieve the current cart from Medusa if a cart_id is stored locally,
 * validating that it still exists and is not completed. Returns `null` when
 * no valid cart exists (no stored id, 404, or completed cart).
 */
export async function getCart() {
  const cartId = getStoredCartId();
  if (!cartId) return null;

  try {
    const sdk = getMedusaClient();
    const { cart } = await sdk.store.cart.retrieve(cartId, { fields: CART_FIELDS });
    // If cart is completed (order placed), clear it locally.
    if ((cart as Record<string, unknown>).completed_at) {
      clearCartId();
      return null;
    }
    return cart;
  } catch (err: unknown) {
    // 404 or any error → stale id, clear it.
    if (
      typeof err === "object" &&
      err != null &&
      "message" in err &&
      typeof (err as Record<string, unknown>).message === "string" &&
      ((err as Record<string, string>).message.includes("404") ||
        (err as Record<string, string>).message.includes("not found"))
    ) {
      clearCartId();
    }
    return null;
  }
}

/**
 * Create a new cart for the given region.
 */
export async function createCart(regionId: string) {
  const sdk = getMedusaClient();
  const { cart } = await sdk.store.cart.create(
    { region_id: regionId },
    { fields: CART_FIELDS },
  );
  storeCartId(cart.id);
  return cart;
}

/**
 * Get existing cart or create a new one for the region.
 */
export async function getOrCreateCart(regionId: string) {
  const existing = await getCart();
  if (existing) {
    // If region mismatched, the existing cart is for a different region;
    // clear and create a new one.
    if (existing.region_id !== regionId) {
      clearCartId();
      return createCart(regionId);
    }
    return existing;
  }
  return createCart(regionId);
}

/**
 * Add a product variant to the cart.
 */
export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number,
) {
  const sdk = getMedusaClient();
  const { cart } = await sdk.store.cart.createLineItem(
    cartId,
    { variant_id: variantId, quantity },
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
) {
  const sdk = getMedusaClient();
  const { cart } = await sdk.store.cart.updateLineItem(
    cartId,
    lineItemId,
    { quantity },
    { fields: CART_FIELDS },
  );
  return cart;
}

/**
 * Remove a line item from the cart.
 */
export async function removeLineItem(cartId: string, lineItemId: string) {
  const sdk = getMedusaClient();
  const result = await sdk.store.cart.deleteLineItem(
    cartId,
    lineItemId,
    { fields: CART_FIELDS },
  );
  // deleteLineItem returns { deleted, parent: cart }
  return result.parent;
}

// ---------------------------------------------------------------------------
// Checkout API helpers
// ---------------------------------------------------------------------------

/**
 * Update cart details — email, shipping_address, billing_address, etc.
 */
export async function updateCart(cartId: string, data: Record<string, unknown>) {
  const sdk = getMedusaClient();
  const { cart } = await sdk.store.cart.update(cartId, data, {
    fields: CART_FIELDS,
  });
  return cart;
}

/**
 * Fetch available shipping options for a cart.
 */
export async function getShippingOptions(cartId: string) {
  const sdk = getMedusaClient();
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions({
    cart_id: cartId,
  });
  return shipping_options;
}

/**
 * Add a shipping method to the cart.
 */
export async function addShippingMethod(cartId: string, optionId: string) {
  const sdk = getMedusaClient();
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
export async function createPaymentSessions(cartId: string) {
  const sdk = getMedusaClient();
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
export async function completeCart(cartId: string) {
  const sdk = getMedusaClient();
  return sdk.store.cart.complete(cartId);
}
