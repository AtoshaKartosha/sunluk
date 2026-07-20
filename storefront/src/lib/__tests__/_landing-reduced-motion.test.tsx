import type * as FramerMotion from "framer-motion";
import { render } from "@testing-library/react";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

// Hoisted file-level mock: force reduced motion ON for this whole file.
vi.mock("framer-motion", async () => {
  const actual = await vi.importActual<typeof FramerMotion>("framer-motion");
  return { ...actual, useReducedMotion: () => true };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/ru",
}));

class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
beforeEach(() => {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
  (window as unknown as { matchMedia: unknown }).matchMedia = () => ({
    matches: true,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
});
afterEach(() => {
  document.body.innerHTML = "";
});

import { HeroSection } from "../../components/landing/HeroSection";
import { EditorialSection } from "../../components/landing/EditorialSection";
import { AboutSection } from "../../components/landing/AboutSection";
import NewsletterSection from "../../components/landing/NewsletterSection";
import { CollectionSection } from "../../components/landing/CollectionSection";

const noHiddenContent = (html: string) => {
  const stripped = html.replace(
    /opacity-0|group-hover:opacity-0|group-hover:opacity-100/g,
    "",
  );
  return !/style="[^"]*opacity:\s*0/i.test(stripped) && !/opacity:0/.test(stripped);
};

describe("Landing reduced-motion safety", () => {
  it("hero content stays visible when reduced motion is on", () => {
    const { container } = render(<HeroSection />);
    expect(noHiddenContent(container.innerHTML)).toBe(true);
  });

  it("editorial models stay visible when reduced motion is on", () => {
    const { container } = render(<EditorialSection />);
    expect(noHiddenContent(container.innerHTML)).toBe(true);
  });

  it("about image/text stay visible when reduced motion is on", () => {
    const { container } = render(<AboutSection />);
    expect(noHiddenContent(container.innerHTML)).toBe(true);
  });

  it("newsletter content stays visible when reduced motion is on", () => {
    const { container } = render(<NewsletterSection />);
    expect(noHiddenContent(container.innerHTML)).toBe(true);
  });

  it("collection fallback stays visible when reduced motion is on", () => {
    const { container } = render(<CollectionSection locale="ru" products={[]} />);
    expect(noHiddenContent(container.innerHTML)).toBe(true);
  });
});
