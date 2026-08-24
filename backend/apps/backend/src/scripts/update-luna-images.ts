import type { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows";

const LUNA_HANDLE = "luna";

const NEW_IMAGE_URLS = [
  "https://api.sunluk.ru/static/1787584806460-Silver%20Chain%204.webp",
  "https://api.sunluk.ru/static/1787584806460-Silver%20Chain%205.webp",
] as const;

type ProductQueryResult = {
  id: string;
  handle: string;
  images?: Array<{ id?: string; url?: string }>;
};

// ponytail: temporary operational migration; will be removed after verified production mutation
export default async function updateLunaImages({
  container,
}: {
  container: MedusaContainer;
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "images.id", "images.url"],
    filters: { handle: LUNA_HANDLE },
  });

  if (!products || products.length === 0 || !products[0]) {
    throw new Error(`Product with handle '${LUNA_HANDLE}' was not found.`);
  }

  const luna = products[0] as ProductQueryResult;

  if (!luna.id || typeof luna.id !== "string") {
    throw new Error(`Invalid or missing product ID for handle '${LUNA_HANDLE}'.`);
  }

  if (!Array.isArray(luna.images)) {
    throw new Error(`Images for product '${LUNA_HANDLE}' could not be read or are not an array.`);
  }

  for (const img of luna.images) {
    if (!img || typeof img.url !== "string") {
      throw new Error(`Product '${LUNA_HANDLE}' contains an image entry with an invalid or missing URL.`);
    }
  }

  const currentUrls = luna.images.map((img) => img.url as string);
  const missingUrls = NEW_IMAGE_URLS.filter((url) => !currentUrls.includes(url));

  if (missingUrls.length === 0) {
    logger.info(
      `Luna product already has all required images (${currentUrls.length} total). No update needed.`
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
    `Updated Luna images: appended ${missingUrls.length} image(s) (${currentUrls.length} -> ${updatedImages.length} total).`
  );
}
