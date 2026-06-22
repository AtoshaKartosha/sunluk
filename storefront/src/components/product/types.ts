/**
 * Presentational types matching Medusa Store API product shapes.
 * Mirrors @medusajs/types HttpTypes without requiring the package.
 */

export interface ProductImage {
  id: string
  url: string
}

export interface ProductOption {
  id: string
  title: string
  values?: Array<string | { id?: string; value: string }>
}

export interface VariantOptionValue {
  option_id: string
  value: string
}

export interface CalculatedPrice {
  calculated_amount: number
  currency_code: string
}

export interface ProductVariant {
  id: string
  title?: string | null
  sku?: string | null
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
  inventory_quantity?: number | null
  options?: VariantOptionValue[] | null
  calculated_price?: CalculatedPrice | null
  images?: ProductImage[] | null
}

export interface StoreProduct {
  id: string
  title: string
  handle: string
  subtitle?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: ProductImage[] | null
  options?: ProductOption[] | null
  variants?: ProductVariant[] | null
  is_giftcard?: boolean
  status?: string
  created_at?: string
  updated_at?: string
  metadata?: Record<string, unknown> | null
}

/** Stock/delivery information derived from a resolved variant. */
export interface StockInfo {
  /** Whether the variant is currently purchasable (in stock or backorderable). */
  available: boolean
  /** Label key: "inStock" | "lowStock" | "outOfStock" | "backorderAvailable" */
  status: "inStock" | "lowStock" | "outOfStock" | "backorderAvailable"
  /** Human-readable stock message e.g. "Only 2 left", "Backorder: ships in 7–10 days". */
  message: string
  /** Delivery promise message e.g. "Free delivery by Friday" */
  deliveryPromise: string | null
}

/** A structured product fact row. */
export interface ProductFact {
  label: string
  value: string
}

/** Labels for the VariantSelector component. */
export interface VariantSelectorLabels {
  selectAllOptions: string
  unavailable: string
  outOfStock: string
  preOrder: string
  invalidQuantity: string
  addToCart: string
  quantity: string
  decreaseQuantity: string
  increaseQuantity: string
  price: string
  cost: string
  inStock: string
  lowStock: string
  backorderAvailable: string
  notAvailable: string
  deliveryPromise: string
  adding: string
  materialNames: Record<string, string>
}

/** Labels for social-proof section. */
export interface SocialProofLabels {
  heading: string
  placeholder: string
}

/** Labels for product facts section. */
export interface ProductFactsLabels {
  heading: string
}
