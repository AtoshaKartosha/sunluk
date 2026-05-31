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
