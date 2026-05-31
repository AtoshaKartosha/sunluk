import { getMedusaClient, getMedusaClientWithLocale } from "../medusa";
import type { ResolvedRegion } from "./regions";

// ---- Types ----

export interface ProductPrice {
  calculated_amount: number;
  currency_code: string;
}

export interface ProductVariantOption {
  option_id: string;
  value: string;
}

export interface ProductListVariant {
  id: string;
  title: string | null;
  sku: string | null;
  manage_inventory: boolean | null;
  allow_backorder: boolean | null;
  inventory_quantity: number | null;
  calculated_price: ProductPrice | null;
}

export interface ProductDetailVariant extends ProductListVariant {
  options: ProductVariantOption[] | null;
}

export interface ProductOptionValue {
  id: string;
  value: string;
}

export interface ProductOption {
  id: string;
  title: string;
  values: ProductOptionValue[] | string[];
}

export interface ProductImage {
  id: string;
  url: string;
}

/** Shape for product cards in the list view. */
export interface ProductListItem {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  images: ProductImage[] | null;
  variants: ProductListVariant[] | null;
}

/** Full product shape for the detail page. */
export interface ProductDetail extends ProductListItem {
  description: string | null;
  options: ProductOption[] | null;
  variants: ProductDetailVariant[] | null;
}

export interface ProductListResult {
  products: ProductListItem[];
  count: number;
}

// ---- Field selectors ----

const LIST_FIELDS = [
  "id", "title", "handle", "thumbnail",
  "*images",
  "*variants",
  "*variants.calculated_price",
  "+variants.inventory_quantity",
].join(",");

const DETAIL_FIELDS = [
  "id", "title", "handle", "thumbnail", "description",
  "*images",
  "*options",
  "*options.values",
  "*variants",
  "*variants.calculated_price",
  "*variants.options",
  "+variants.inventory_quantity",
].join(",");

// ---- Helpers ----

function ensureRegion(region: ResolvedRegion): asserts region is { regionId: string; name: string; currencyCode: string; countryCode: string } {
  if ("type" in region) {
    throw new Error(
      `Cannot query products: region "${region.countryCode}" is unsupported.`,
    );
  }
}
function normalizeProductOptions<T extends ProductDetail>(product: T): T {
  if (!product.options) return product;

  return {
    ...product,
    options: product.options.map((option) => ({
      ...option,
      values: option.values.map((value) =>
        typeof value === "string" ? value : value.value,
      ),
    })),
  };
}


/**
 * List published products for a resolved region.
 *
 * Throws when the region is unsupported — callers must first resolve the
 * region and handle `RegionUnsupported` before calling.
 */
export async function listProducts(
  region: ResolvedRegion,
  medusaLocale?: string,
): Promise<ProductListResult> {
  ensureRegion(region);

  const sdk = medusaLocale
    ? getMedusaClientWithLocale(medusaLocale)
    : getMedusaClient();

  const data = (await sdk.store.product.list({
    region_id: region.regionId,
    fields: LIST_FIELDS,
    limit: 100,
  })) as unknown as {
    products: ProductListItem[];
    count: number;
  };

  return { products: data.products, count: data.count };
}

/**
 * Retrieve a single published product by handle for a resolved region.
 *
 * Returns `null` when no product matches the handle (unpublished, missing,
 * or not sellable in the region). Throws when the region is unsupported.
 */
export async function getProduct(
  handle: string,
  region: ResolvedRegion,
  medusaLocale?: string,
): Promise<ProductDetail | null> {
  ensureRegion(region);

  const sdk = medusaLocale
    ? getMedusaClientWithLocale(medusaLocale)
    : getMedusaClient();

  const data = (await sdk.store.product.list({
    handle,
    region_id: region.regionId,
    fields: DETAIL_FIELDS,
    limit: 1,
  })) as unknown as {
    products: ProductDetail[];
  };

  const product = data.products[0];
  return product ? normalizeProductOptions(product) : null;
}
