/** Cart-related types shared between CartContext and CartDrawer. */

export interface CartLineItemOption {
  id?: string;
  name: string;
  value: string;
}

export interface StoreCartLineItem {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string;
  variant_id?: string;
  product_id?: string;
  variant?: {
    id: string;
    title: string;
    sku?: string;
    options?: CartLineItemOption[];
  };
  product?: {
    id: string;
    title: string;
    handle: string;
    thumbnail?: string;
  };
  options?: CartLineItemOption[];
  quantity: number;
  unit_price: number;
  total: number;
  original_total?: number;
  tax_total?: number;
  discount_total?: number;
}

export interface StoreCart {
  id: string;
  region_id?: string;
  currency_code?: string;
  items?: StoreCartLineItem[];
  total: number;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  shipping_total: number;
  item_total: number;
  item_subtotal: number;
  item_tax_total: number;
  item_count?: number;
}
