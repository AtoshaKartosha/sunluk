import { existsSync, statSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const backendStatic = resolve(__dirname, "../../../../backend/apps/backend/static");
const storefrontImages = resolve(__dirname, "../../../public/images");

const backendProductAndPackagingMedia = [
  "1783929099277-Turquoise.webp",
  "1783932921562-Turquoise 2.webp",
  "1783932921563-Turquoise 3.webp",
  "1783929260183-Leather Loop.webp",
  "1783932869580-Leather Loop 2.webp",
  "1783932869580-Leather Loop 3.webp",
  "1783929297839-Silver Chain.webp",
  "1783932890776-Silver Chain 2.webp",
  "1783932890777-Silver Chain 3.webp",
  "1787584806460-Silver Chain 4.webp",
  "1787584806460-Silver Chain 5.webp",
  "1783929220517-Sand Chain.webp",
  "1783932907893-Sand Chain 2.webp",
  "1783932907893-Sand Chain 3.webp",
  "1783928971665-Purple.webp",
  "1783932944380-Purple 2.webp",
  "1783932944380-Purple 3.webp",
  "1783933291725-Sun Chain.webp",
  "1783933291729-Sun Chain 2.webp",
  "1783933291730-Sun Chain 3.webp",
  "1783933291730-Sun Chain 4.webp",
  "1784536571321-Brand pouch.webp",
  "1784536554689-Brand pouch (Turquoise).webp",
  "1784536542288-Brand pouch (Brown).webp",
  "1782832052287-gift-box.png",
  "1782832083854-silk-pouch.png",
  "wooden-case-placeholder.webp",
];

const localFallbackProductMedia = [
  "product-turquoise.webp",
  "product-leather.webp",
  "product-silver.webp",
  "product-sand.webp",
];

function expectPaired(directory: string, filename: string) {
  const pair = filename.replace(/\.(webp|png)(?=($|[?#]))/i, (_, extension) =>
    extension.toLowerCase() === "webp" ? ".png" : ".webp",
  );

  for (const name of [filename, pair]) {
    const path = resolve(directory, name.split(/[?#]/, 1)[0]);
    expect(existsSync(path), `${name} is missing`).toBe(true);
    expect(statSync(path).size, `${name} is empty`).toBeGreaterThan(0);
  }
}

describe("product media assets", () => {
  it("pairs every current seed product or packaging asset", () => {
    expect(backendProductAndPackagingMedia.filter((name) => /\.webp(?=($|[?#]))/i.test(name))).not.toHaveLength(0);
    expect(backendProductAndPackagingMedia.filter((name) => /\.png(?=($|[?#]))/i.test(name))).not.toHaveLength(0);

    for (const media of backendProductAndPackagingMedia) {
      expectPaired(backendStatic, media);
    }
  });

  it("pairs all four local fallback product media assets", () => {
    expect(localFallbackProductMedia).not.toHaveLength(0);

    for (const media of localFallbackProductMedia) {
      expectPaired(storefrontImages, media);
    }
  });
});
