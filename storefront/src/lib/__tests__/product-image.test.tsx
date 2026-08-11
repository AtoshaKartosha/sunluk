import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import {
  ProductImage,
  resolveProductImageSources,
} from "@/components/product/ProductImage";

describe("ProductImage", () => {
  it("prefers WebP and falls back to PNG", () => {
    const { container } = render(
      <ProductImage src="/images/product.webp" alt="Product" width={100} height={100} />,
    );

    expect(container.querySelector("source")).toHaveAttribute("srcset", "/images/product.webp");
    expect(container.querySelector("source")).toHaveAttribute("type", "image/webp");
    expect(container.querySelector("img")).toHaveAttribute("src", "/images/product.png");
    expect(container.querySelector("img")).toHaveAttribute("alt", "Product");
  });

  it("uses a same-stem WebP source for PNG input", () => {
    const { container } = render(
      <ProductImage src="/images/product.png" alt="Product" width={100} height={100} />,
    );

    expect(container.querySelector("source")).toHaveAttribute("srcset", "/images/product.webp");
    expect(container.querySelector("img")).toHaveAttribute("src", "/images/product.png");
  });

  it("uses a full-size relative wrapper only for fill images", () => {
    const { container: fillContainer } = render(
      <ProductImage src="/images/product.webp" alt="Product" fill />,
    );
    const { container: sizedContainer } = render(
      <ProductImage src="/images/product.webp" alt="Product" width={100} height={100} />,
    );

    expect(fillContainer.querySelector("picture")).toHaveAttribute(
      "class",
      "relative block h-full w-full",
    );
    expect(sizedContainer.querySelector("picture")).not.toHaveAttribute("class");
  });

  it("preserves encoded paths, query strings, and hashes", () => {
    expect(resolveProductImageSources("/static/Brand%20pouch.webp?size=2#media")).toEqual({
      webp: "/static/Brand%20pouch.webp?size=2#media",
      fallback: "/static/Brand%20pouch.png?size=2#media",
    });
  });

  it("replaces the terminal pathname extension without touching directory names or queries", () => {
    expect(resolveProductImageSources("/static/archive.png/item.png?x=.webp")).toEqual({
      webp: "/static/archive.png/item.webp?x=.webp",
      fallback: "/static/archive.png/item.png?x=.webp",
    });
  });

  it("passes extension-like query and hash values through unchanged", () => {
    const src = "/images/product.jpg?format=.webp#preview.png";
    const { container } = render(
      <ProductImage src={src} alt="Product" width={100} height={100} />,
    );

    expect(container.querySelector("picture")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("src", src);
    expect(resolveProductImageSources(src)).toBeNull();
  });

  it("passes non-paired formats through unchanged", () => {
    const { container } = render(
      <ProductImage src="/images/product.jpg?size=2#media" alt="Product" width={100} height={100} />,
    );

    expect(container.querySelector("picture")).toBeNull();
    expect(container.querySelector("img")).toHaveAttribute("src", "/images/product.jpg?size=2#media");
    expect(container.querySelector("img")).toHaveAttribute("alt", "Product");
    expect(resolveProductImageSources("/images/product.jpg")).toBeNull();
  });
});
