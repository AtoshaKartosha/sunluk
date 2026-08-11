import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/ru" }));

// jsdom lacks IntersectionObserver + matchMedia that framer-motion's
// whileInView / useReducedMotion need. Polyfill per-test.
class IO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
const installEnv = () => {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
  (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
  (window as unknown as { matchMedia: unknown }).matchMedia = () => ({
    matches: false,
    media: "",
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
};

import { HeroSection } from "../../components/landing/HeroSection";
import { EditorialSection } from "../../components/landing/EditorialSection";
import { AboutSection } from "../../components/landing/AboutSection";
import NewsletterSection from "../../components/landing/NewsletterSection";
import { CollectionSection } from "../../components/landing/CollectionSection";

describe("Landing perf smoke", () => {
  beforeEach(installEnv);
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("HeroSection: renders background image slider", () => {
    render(<HeroSection locale="ru" />);
    const img = screen.getByAltText(
      "SUNLUK hero slide 1",
    ) as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.getAttribute("src")).toContain("sunluk_main.webp");
    expect(img.getAttribute("sizes")).toBe("(min-width: 768px) 52vw, 100vw");
  });

  it("EditorialSection: 6 imgs (3 alt + 3 decorative), all sized", () => {
    const { container } = render(<EditorialSection locale="ru" />);
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(6);
    const alts = Array.from(imgs).map((i) => i.getAttribute("alt") ?? "");
    expect(alts.filter((a) => a).length).toBe(3);
    expect(alts.filter((a) => a === "").length).toBe(3);
    imgs.forEach((i) => expect(i.getAttribute("sizes")).toBeTruthy());
  });

  it("AboutSection: image slider container with role img and aria-label", () => {
    const { container } = render(<AboutSection locale="ru" />);
    const slider = container.querySelector('[role="img"]');
    expect(slider).toBeTruthy();
    expect(slider?.getAttribute("aria-label")).toBeTruthy();
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(2);
    imgs.forEach((img) => {
      expect(img.getAttribute("sizes")).toBeTruthy();
    });
  });

  it("NewsletterSection: 1 bg img alt+sizes, svg aria-hidden+focusable=false", () => {
    const { container } = render(<NewsletterSection />);
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(1);
    expect(imgs[0].getAttribute("alt")).toBe("Warm turquoise sea waves background");
    expect(imgs[0].getAttribute("sizes")).toBe("100vw");
    container.querySelectorAll("svg").forEach((s) => {
      expect(s.getAttribute("aria-hidden")).toBe("true");
      expect(s.getAttribute("focusable")).toBe("false");
    });
  });

  it("CollectionSection fallback: 4 imgs alt+sizes", () => {
    const { container } = render(<CollectionSection locale="ru" products={[]} />);
    const imgs = container.querySelectorAll("img");
    expect(imgs.length).toBe(4);
    imgs.forEach((i) => {
      expect(i.getAttribute("alt")).toBeTruthy();
      expect(i.getAttribute("sizes")).toBeTruthy();
    });
  });
});
