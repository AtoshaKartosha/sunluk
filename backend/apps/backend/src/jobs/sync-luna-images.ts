import type { Logger, MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

const LUNA_HANDLE = "luna";

const NEW_IMAGE_URLS = [
  "https://api.sunluk.ru/static/1787584806460-Silver%20Chain%204.webp",
  "https://api.sunluk.ru/static/1787584806460-Silver%20Chain%205.webp",
];

type ProductQueryResult = {
  id?: string;
  handle?: string;
  images?: Array<{ id?: string; url?: string }>;
};

// ponytail: one-shot scheduled job to sync missing Luna images without blocking server startup
export default async function syncLunaImages(container: MedusaContainer) {
  let logger: Logger | typeof console;
  try {
    logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  } catch {
    logger = console;
  }

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "images.id", "images.url"],
      filters: { handle: LUNA_HANDLE },
    });

    if (!products || products.length === 0 || !products[0]) {
      logger.warn(`[sync-luna-images] Product with handle '${LUNA_HANDLE}' not found; skipping.`);
      return;
    }

    const luna = products[0] as ProductQueryResult;

    if (!luna.id || typeof luna.id !== "string") {
      logger.warn(`[sync-luna-images] Product '${LUNA_HANDLE}' missing valid ID; skipping.`);
      return;
    }

    const currentImages = Array.isArray(luna.images) ? luna.images : [];
    const currentUrls = currentImages
      .map((img) => img?.url)
      .filter((url): url is string => typeof url === "string");

    const missingUrls = NEW_IMAGE_URLS.filter((url) => !currentUrls.includes(url));

    if (missingUrls.length === 0) {
      logger.info(
        `[sync-luna-images] Luna product already has all images (${currentUrls.length} total). No update needed.`
      );
      return;
    }

    const updatedImages = [...currentUrls, ...missingUrls].map((url) => ({ url }));

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: luna.id },
        update: {
          images: updatedImages,
        },
      },
    });

    logger.info(
      `[sync-luna-images] Appended ${missingUrls.length} missing Luna image(s) (${currentUrls.length} -> ${updatedImages.length} total).`
    );
  } catch (error) {
    logger.error(`[sync-luna-images] Execution failed:`, error);
  }
}

export const config = {
  name: "sync-luna-images",
  schedule: "* * * * *",
  numberOfExecutions: 1,
};
