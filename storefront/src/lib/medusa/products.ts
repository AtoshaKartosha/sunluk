import { getMedusaClient, getMedusaClientWithLocale } from "../medusa";
import type { ResolvedRegion } from "./regions";
import type Medusa from "@medusajs/js-sdk";

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

export interface ProductCategory {
  id: string;
  name: string;
  handle: string;
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
  categories?: ProductCategory[] | null;
  metadata?: Record<string, unknown> | null;
}

/** Full product shape for the detail page. */
export interface ProductDetail extends ProductListItem {
  description: string | null;
  subtitle: string | null;
  options: ProductOption[] | null;
  variants: ProductDetailVariant[] | null;
  categories: ProductCategory[] | null;
  tags?: { id: string; value: string }[] | null;
}

export interface ProductListResult {
  products: ProductListItem[];
  count: number;
}

// ---- Field selectors ----

const LIST_FIELDS = [
  "id", "title", "handle", "thumbnail", "metadata",
  "*images",
  "*categories",
  "*variants",
  "*variants.calculated_price",
  "+variants.inventory_quantity",
].join(",");

const DETAIL_FIELDS = [
  "id", "title", "handle", "thumbnail", "description", "subtitle", "metadata",
  "*images",
  "*options",
  "*options.values",
  "*variants",
  "*variants.calculated_price",
  "*variants.options",
  "+variants.inventory_quantity",
  "*categories",
  "*tags",
].join(",");

// ---- Helpers ----

function ensureRegion(region: ResolvedRegion): asserts region is { regionId: string; name: string; currencyCode: string; countryCode: string } {
  if ("type" in region) {
    throw new Error(
      `Cannot query products: region "${region.countryCode}" is unsupported.`,
    );
  }
}

// ponytail: Packaging category is the source of truth for packaging discovery.
// Resolved once and cached for the process lifetime — the category handle is
// stable; if admin moves/renames it, this cache is invalidated by a process restart.
const PACKAGING_CATEGORY_HANDLE = "packaging";
let packagingCategoryIdPromise: Promise<string | null> | null = null;

function resolvePackagingCategoryId(sdk: Medusa): Promise<string | null> {
  if (packagingCategoryIdPromise) return packagingCategoryIdPromise;
  packagingCategoryIdPromise = (async () => {
    try {
      const { product_categories } = (await sdk.store.category.list({
        handle: PACKAGING_CATEGORY_HANDLE,
        fields: "id,handle",
        limit: 1,
      })) as unknown as { product_categories: { id: string; handle: string }[] };
      return product_categories[0]?.id ?? null;
    } catch {
      return null;
    }
  })();
  return packagingCategoryIdPromise;
}

function isPackagingProduct(p: { categories?: ProductCategory[] | null }): boolean {
  return p.categories?.some((c) => c.handle === PACKAGING_CATEGORY_HANDLE) ?? false;
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

  const filteredProducts = data.products.filter((p) => !isPackagingProduct(p));

  return { products: filteredProducts, count: filteredProducts.length };
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

/**
 * List related products for a PDP, excluding the given handle.
 *
 * Falls back to recent products when no category filter is available.
 * Returns at most `limit` products (default 4).
 */
export async function listRelatedProducts(
  region: ResolvedRegion,
  excludeHandle: string,
  medusaLocale?: string,
  limit = 4,
): Promise<ProductListItem[]> {
  ensureRegion(region);

  const sdk = medusaLocale
    ? getMedusaClientWithLocale(medusaLocale)
    : getMedusaClient();

  const data = (await sdk.store.product.list({
    region_id: region.regionId,
    fields: LIST_FIELDS,
    limit: limit + 6, // fetch extra in case excluded products appear
  })) as unknown as {
    products: ProductListItem[];
    count: number;
  };

  return data.products
    .filter((p) => p.handle !== excludeHandle && !isPackagingProduct(p))
    .slice(0, limit);
}

/**
 * Fetch the specific product details for packaging options.
 */
export async function listPackagingProducts(
  region: ResolvedRegion,
  medusaLocale?: string,
): Promise<ProductDetail[]> {
  ensureRegion(region);

  const sdk = medusaLocale
    ? getMedusaClientWithLocale(medusaLocale)
    : getMedusaClient();

  const categoryId = await resolvePackagingCategoryId(sdk);
  if (!categoryId) return [];

  const data = (await sdk.store.product.list({
    category_id: categoryId,
    region_id: region.regionId,
    fields: DETAIL_FIELDS,
    limit: 100,
  })) as unknown as {
    products: ProductDetail[];
  };

  return data.products.map(normalizeProductOptions);
}
