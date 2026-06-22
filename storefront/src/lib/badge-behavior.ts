/**
 * Pure business logic for product badge → CTA behavior mapping.
 *
 * The badge (stored in product.metadata.badge) is a manual marketing flag
 * set by the manager in Medusa Admin. This module defines how each badge
 * affects the add-to-cart flow on the storefront.
 */

export type BadgeValue = "in_stock" | "sold_out" | "pre_order" | "discount"

export type CtaState = "enabled" | "disabled" | "pre_order"

export interface BadgeCtaResult {
  /** Whether the add-to-cart button should be enabled. */
  enabled: boolean
  /** Display state for the CTA button. */
  state: CtaState
  /** Stock message override (null = use stock-derived message). */
  messageOverride: string | null
}

/**
 * Derives CTA behavior from the product badge and variant availability.
 *
 * Rules:
 * - `sold_out`  → button disabled, message "Out of stock" (i18n key: outOfStock)
 * - `pre_order` → button enabled even when OOS, message "Pre-order" (i18n key: preOrder)
 * - `discount`  → no behavior change (badge is cosmetic, price comes from Price List)
 * - `in_stock`  → no behavior change
 * - absent/unknown → no behavior change
 */
export function getBadgeCta(
  badge: string | null | undefined,
  isAvailable: boolean,
): BadgeCtaResult {
  switch (badge) {
    case "sold_out":
      return { enabled: false, state: "disabled", messageOverride: null }

    case "pre_order":
      return {
        enabled: true,
        state: "pre_order",
        messageOverride: null, // i18n handled by caller via labels.preOrder
      }

    case "discount":
    case "in_stock":
    default:
      return {
        enabled: isAvailable,
        state: isAvailable ? "enabled" : "disabled",
        messageOverride: null,
      }
  }
}

/** Whether a badge value is one of the recognized marketing flags. */
export function isKnownBadge(
  value: string | null | undefined,
): value is BadgeValue {
  return (
    value === "in_stock" ||
    value === "sold_out" ||
    value === "pre_order" ||
    value === "discount"
  )
}
