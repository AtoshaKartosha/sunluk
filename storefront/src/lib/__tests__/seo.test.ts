import { describe, it, expect, afterEach } from "vitest";
import {
  siteOrigin,
  routePath,
  routeAlternates,
  buildRouteMetadata,
  safeJsonLd,
} from "../seo";

describe("siteOrigin", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = original;
    }
  });

  it("falls back to https://sunluk.com when the env var is unset", () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(siteOrigin()).toBe("https://sunluk.com");
  });

  it("uses NEXT_PUBLIC_SITE_URL and trims trailing slashes", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com///";
    expect(siteOrigin()).toBe("https://example.com");
  });
});

describe("routePath", () => {
  it("builds locale-prefixed paths for each public route", () => {
    expect(routePath("ru", "home")).toBe("/ru");
    expect(routePath("en", "products")).toBe("/en/products");
    expect(routePath("ru", "info")).toBe("/ru/info");
    expect(routePath("en", "product", "silk-case")).toBe(
      "/en/products/silk-case",
    );
  });

  it("rejects a product route without a handle", () => {
    expect(() => routePath("ru", "product")).toThrow();
  });
});

describe("routeAlternates", () => {
  it("builds a canonical and ru/en/x-default for a PDP handle", () => {
    const alt = routeAlternates("ru", "product", "silk-case");
    expect(alt.canonical).toBe("https://sunluk.com/ru/products/silk-case");
    expect(alt.languages.ru).toBe("https://sunluk.com/ru/products/silk-case");
    expect(alt.languages.en).toBe("https://sunluk.com/en/products/silk-case");
    expect(alt.languages["x-default"]).toBe(
      "https://sunluk.com/ru/products/silk-case",
    );
  });

  it("makes the canonical follow the requested locale", () => {
    const alt = routeAlternates("en", "products");
    expect(alt.canonical).toBe("https://sunluk.com/en/products");
    expect(alt.languages.ru).toBe("https://sunluk.com/ru/products");
    expect(alt.languages["x-default"]).toBe("https://sunluk.com/ru/products");
  });
});

describe("buildRouteMetadata", () => {
  it("projects canonical, hreflang, and social cards", () => {
    const meta = buildRouteMetadata({
      locale: "ru",
      route: "info",
      title: "SUNLUK — Информация",
      description: "Условия покупки, доставки и возврата SUNLUK.",
    });

    expect(meta.title).toBe("SUNLUK — Информация");
    expect(meta.alternates?.canonical).toBe("https://sunluk.com/ru/info");
    expect(meta.alternates?.languages).toEqual({
      ru: "https://sunluk.com/ru/info",
      en: "https://sunluk.com/en/info",
      "x-default": "https://sunluk.com/ru/info",
    });
    expect(meta.openGraph?.url).toBe("https://sunluk.com/ru/info");
    expect(meta.openGraph?.locale).toBe("ru_RU");
    expect(
      meta.twitter && "card" in meta.twitter ? meta.twitter.card : undefined,
    ).toBe("summary_large_image");
  });

  it("omits images when none is provided", () => {
    const meta = buildRouteMetadata({
      locale: "en",
      route: "home",
      title: "SUNLUK — Eyewear Accessories",
      description: "Eyewear accessories.",
    });
    expect(meta.openGraph?.images).toBeUndefined();
  });
});

describe("safeJsonLd", () => {
  it("escapes < so data cannot terminate the script element", () => {
    const out = safeJsonLd({ name: "a<b>c</d" });
    expect(out).not.toContain("<");
    expect(JSON.parse(out)).toEqual({ name: "a<b>c</d" });
  });
});
