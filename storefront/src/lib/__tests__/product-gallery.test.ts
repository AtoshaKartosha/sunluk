import { describe, it, expect } from "vitest";
import { collectSources, calculateZoomPosition } from "../../components/product/ProductGallery";

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
