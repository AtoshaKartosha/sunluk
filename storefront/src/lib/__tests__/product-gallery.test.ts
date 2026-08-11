import { createElement } from "react";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  calculateZoomPosition,
  collectSources,
  ProductGallery,
} from "../../components/product/ProductGallery";

describe("Product Gallery Image Sources Collection", () => {
  it("handles null or undefined images list and returns only the thumbnail", () => {
    expect(collectSources(null, "thumb.jpg")).toEqual(["thumb.jpg"]);
    expect(collectSources(undefined, "thumb.jpg")).toEqual(["thumb.jpg"]);
    expect(collectSources([], "thumb.jpg")).toEqual(["thumb.jpg"]);
  });

  it("handles null or undefined thumbnail and returns images list", () => {
    const images = [
      { id: "1", url: "img1.jpg" },
      { id: "2", url: "img2.jpg" },
    ];
    expect(collectSources(images, null)).toEqual(["img1.jpg", "img2.jpg"]);
    expect(collectSources(images, undefined)).toEqual(["img1.jpg", "img2.jpg"]);
  });

  it("returns an empty array if both images and thumbnail are missing", () => {
    expect(collectSources(null, null)).toEqual([]);
    expect(collectSources(undefined, undefined)).toEqual([]);
  });

  it("deduplicates URLs if the thumbnail is also present in the images array", () => {
    const images = [
      { id: "1", url: "thumb.jpg" },
      { id: "2", url: "img1.jpg" },
    ];
    expect(collectSources(images, "thumb.jpg")).toEqual(["thumb.jpg", "img1.jpg"]);
  });

  it("preserves order of images", () => {
    const images = [
      { id: "1", url: "img1.jpg" },
      { id: "2", url: "img2.jpg" },
    ];
    expect(collectSources(images, "thumb.jpg")).toEqual(["thumb.jpg", "img1.jpg", "img2.jpg"]);
  });
});

describe("Product Gallery Zoom Coordinate Calculations", () => {
  const rect = { left: 100, top: 200, width: 100, height: 100 };

  it("computes correct percentages for standard mouse positions", () => {
    // Center of the element
    expect(calculateZoomPosition(150, 250, rect)).toEqual({ x: 50, y: 50 });

    // Top-left corner
    expect(calculateZoomPosition(100, 200, rect)).toEqual({ x: 0, y: 0 });

    // Bottom-right corner
    expect(calculateZoomPosition(200, 300, rect)).toEqual({ x: 100, y: 100 });
  });

  it("clamps out-of-bounds positions to 0 and 100", () => {
    // Negative offset (beyond top-left)
    expect(calculateZoomPosition(50, 150, rect)).toEqual({ x: 0, y: 0 });

    // Exceeding element size (beyond bottom-right)
    expect(calculateZoomPosition(250, 350, rect)).toEqual({ x: 100, y: 100 });
  });

  it("handles a bounding box with zero dimensions gracefully", () => {
    const zeroRect = { left: 100, top: 200, width: 0, height: 0 };
    expect(calculateZoomPosition(150, 250, zeroRect)).toEqual({ x: 50, y: 50 });
  });
});

describe("Product Gallery Pointer Zoom Behavior", () => {
  let desktopZoomMatches = true;

  beforeEach(() => {
    desktopZoomMatches = true;
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: desktopZoomMatches,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const images = [
    { id: "1", url: "/chain-1.webp" },
    { id: "2", url: "/chain-2.webp" },
  ];

  function renderGallery(nextImages = images) {
    return render(
      createElement(ProductGallery, {
        images: nextImages,
        title: "Chain",
      }),
    );
  }

  function getHero(): HTMLDivElement {
    return screen.getByRole("button", { name: "Previous image" })
      .parentElement as HTMLDivElement;
  }

  function getHeroImage(index: number): HTMLImageElement {
    return screen.getByAltText(
      `Chain — image ${index}`,
    ) as HTMLImageElement;
  }

  function enterDesktopZoom(hero: HTMLDivElement) {
    fireEvent.pointerEnter(hero, { pointerType: "mouse" });
  }

  it("shows the complete image below lg and zooms from mouse coordinates on desktop", () => {
    renderGallery();
    const hero = getHero();
    const image = getHeroImage(1);
    Object.defineProperty(hero, "getBoundingClientRect", {
      value: () => ({
        left: 100,
        top: 200,
        width: 200,
        height: 100,
      }),
    });

    expect(image).toHaveClass("object-contain", "lg:object-cover");
    enterDesktopZoom(hero);
    fireEvent.pointerMove(hero, {
      pointerType: "mouse",
      clientX: 150,
      clientY: 225,
    });

    expect(image).toHaveStyle({
      transform: "scale(1.5)",
      transformOrigin: "25% 25%",
    });
  });

  it("does not zoom for touch pointers or mouse pointers below lg", () => {
    renderGallery();
    const hero = getHero();
    const image = getHeroImage(1);

    fireEvent.pointerEnter(hero, { pointerType: "touch" });
    expect(image).toHaveStyle({
      transform: "scale(1)",
      transformOrigin: "center",
    });

    desktopZoomMatches = false;
    fireEvent.pointerEnter(hero, { pointerType: "mouse" });
    expect(image).toHaveStyle({
      transform: "scale(1)",
      transformOrigin: "center",
    });
  });

  it("resets zoom and origin for arrows, thumbnails, and swipes", () => {
    renderGallery();
    const hero = getHero();

    enterDesktopZoom(hero);
    fireEvent.pointerMove(hero, {
      pointerType: "mouse",
      clientX: 1,
      clientY: 1,
    });
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(getHeroImage(2)).toHaveStyle({
      transform: "scale(1)",
      transformOrigin: "center",
    });

    fireEvent.pointerLeave(hero, { pointerType: "mouse" });
    enterDesktopZoom(hero);
    fireEvent.click(
      screen.getAllByRole("button", { name: "Chain — image 1" })[0],
    );
    expect(getHeroImage(1)).toHaveStyle({
      transform: "scale(1)",
      transformOrigin: "center",
    });

    fireEvent.pointerLeave(hero, { pointerType: "mouse" });
    enterDesktopZoom(hero);
    fireEvent.touchStart(hero, { touches: [{ clientX: 200 }] });
    fireEvent.touchEnd(hero, { changedTouches: [{ clientX: 100 }] });
    expect(getHeroImage(2)).toHaveStyle({
      transform: "scale(1)",
      transformOrigin: "center",
    });
  });

  it("resets zoom and selection when the image sources change", async () => {
    const gallery = renderGallery();
    const hero = getHero();
    fireEvent.click(screen.getByRole("button", { name: "Next image" }));
    expect(getHeroImage(2).parentElement?.parentElement).toHaveClass(
      "opacity-100",
    );
    enterDesktopZoom(hero);
    expect(getHeroImage(2)).toHaveStyle({ transform: "scale(1.5)" });

    gallery.rerender(
      createElement(ProductGallery, {
        images: [
          { id: "3", url: "/new-chain-1.webp" },
          { id: "4", url: "/new-chain-2.webp" },
        ],
        title: "Chain",
      }),
    );

    await waitFor(() => {
      expect(getHeroImage(1)).toHaveStyle({
        transform: "scale(1)",
        transformOrigin: "center",
      });
      expect(getHeroImage(1).parentElement?.parentElement).toHaveClass(
        "opacity-100",
      );
    });
  });
});
