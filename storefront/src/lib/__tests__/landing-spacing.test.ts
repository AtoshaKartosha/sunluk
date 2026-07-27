import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const read = (rel: string) =>
  readFileSync(resolve(__dirname, "../../components/landing", rel), "utf-8");

describe("Landing section spacing", () => {
  it("EditorialSection spacing fits original constraints", () => {
    const code = read("EditorialSection.tsx");
    expect(code).toContain("pt-2.5 pb-2.5");
    expect(code).not.toContain("py-10");
    expect(code).not.toContain("sm:py-16");
  });

  it("CollectionSection spacing fits original constraints", () => {
    const code = read("CollectionSection.tsx");
    expect(code).toContain("pt-2.5 pb-2.5");
    expect(code).toContain("mb-2.5");
    expect(code).not.toContain("py-10");
    expect(code).not.toContain("sm:py-16");
    // The heading container (line 24) intentionally uses mb-6 and sm:mb-10.
    // We assert that the product grid no longer contains them, meaning they only appear once in the file.
    expect(code.split("mb-6").length).toBe(2);
    expect(code.split("sm:mb-10").length).toBe(2);
  });

  it("FeaturesSection spacing fits original constraints", () => {
    const code = read("FeaturesSection.tsx");
    expect(code).toContain("pt-2.5 pb-2.5");
    // Ensure the grid-cols-1 sm:grid-cols-2 mobile grid fix is preserved
    expect(code).toContain("grid-cols-1 sm:grid-cols-2");
    expect(code).not.toContain("py-10");
    expect(code).not.toContain("sm:py-16");
  });

  it("AboutSection spacing fits original constraints", () => {
    const code = read("AboutSection.tsx");
    expect(code).toContain("py-2.5");
    expect(code).not.toContain("py-10");
    expect(code).not.toContain("sm:py-16");
  });

  it("ContactsSection spacing fits original constraints", () => {
    const code = read("ContactsSection.tsx");
    expect(code).toContain("px-4 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24");
    expect(code).toContain("mt-12 grid max-w-6xl grid-cols-1 gap-10 md:mt-14");
    expect(code).toContain("mt-5 text-base leading-relaxed");
    expect(code).not.toContain("py-10");
    expect(code).not.toContain("sm:py-16");
    expect(code).not.toContain("mb-10");
    expect(code).not.toContain("sm:mb-14");
    expect(code).not.toContain("pt-10");
    expect(code).not.toContain("sm:pt-14");
  });

  it("NewsletterSection spacing fits original constraints", () => {
    const code = read("NewsletterSection.tsx");
    expect(code).toContain("py-2.5");
    expect(code).not.toContain("py-10");
    expect(code).not.toContain("sm:py-16");
  });

  it("HeroSection spacing fits original constraints", () => {
    const code = read("HeroSection.tsx");
    expect(code).toContain("pb-2.5");
    expect(code).not.toContain("pb-10");
    expect(code).not.toContain("sm:pb-16");
  });
});
