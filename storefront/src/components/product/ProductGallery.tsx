"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import type { ProductImage } from "./types";

interface ProductGalleryProps {
  images: ProductImage[] | null | undefined;
  thumbnail?: string | null;
  title: string;
}

function collectSources(
  images: ProductImage[] | null | undefined,
  thumbnail: string | null | undefined,
): string[] {
  const sources: string[] = [];
  if (thumbnail) sources.push(thumbnail);
  if (images && images.length > 0) {
    for (const img of images) {
      if (img.url && !sources.includes(img.url)) {
        sources.push(img.url);
      }
    }
  }
  return sources;
}

/** Simple swipe detection hook. */
function useSwipe(
  ref: React.RefObject<HTMLDivElement | null>,
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 50,
) {
  const startX = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      startX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      if (startX.current == null) return;
      const diff = startX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > threshold) {
        if (diff > 0) onSwipeLeft();
        else onSwipeRight();
      }
      startX.current = null;
    };

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, onSwipeLeft, onSwipeRight, threshold]);
}

export function ProductGallery({
  images,
  thumbnail,
  title,
}: ProductGalleryProps) {
  const sources = collectSources(images, thumbnail);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % sources.length);
  }, [sources.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + sources.length) % sources.length);
  }, [sources.length]);

  useSwipe(heroRef, goNext, goPrev);

  // Close lightbox on Escape.
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, goNext, goPrev]);

  // No images — placeholder.
  if (sources.length === 0) {
    return (
      <div className="aspect-[4/5] bg-[#e8ddd6] flex items-center justify-center">
        <span className="text-[#2c211b]/40 text-sm font-medium uppercase tracking-widest">
          {title}
        </span>
      </div>
    );
  }

  const isSingle = sources.length === 1;

  return (
    <>
      {/* ---------- Gallery ---------- */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Desktop: vertical thumb rail (left) */}
        {!isSingle && (
          <div className="hidden lg:flex flex-col gap-2 order-first flex-shrink-0 max-h-[500px] overflow-y-auto pr-1">
            {sources.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={[
                  "relative flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors",
                  i === activeIndex
                    ? "border-[#2f6f78]"
                    : "border-transparent hover:border-[#2f6f78]/50",
                ].join(" ")}
                aria-label={`${title} — image ${i + 1}`}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  unoptimized
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Hero image */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          <div
            ref={heroRef}
            className={[
              "relative aspect-[4/5] overflow-hidden bg-[#f4ebe6]",
              !isSingle && "cursor-zoom-in",
            ].join(" ")}
            onClick={() => !isSingle && setLightboxOpen(true)}
          >
            {sources.map((src, i) => (
              <div
                key={src}
                className={[
                  "absolute inset-0 transition-opacity duration-300",
                  i === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0",
                ].join(" ")}
              >
                <Image
                  src={src}
                  alt={`${title} — image ${i + 1}`}
                  fill
                  priority={i === 0}
                  unoptimized
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
            {/* Navigation arrows (multiple images only) */}
            {!isSingle && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-[#f4ebe6]/80 hover:bg-[#f4ebe6] text-[#2c211b] transition-colors"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-[#f4ebe6]/80 hover:bg-[#f4ebe6] text-[#2c211b] transition-colors"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Mobile: horizontal thumb scroll */}
          {!isSingle && (
            <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
              {sources.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={[
                    "relative flex-shrink-0 w-16 h-16 overflow-hidden border-2 transition-colors",
                    i === activeIndex
                      ? "border-[#2f6f78]"
                      : "border-transparent hover:border-[#2f6f78]/50",
                  ].join(" ")}
                  aria-label={`${title} — image ${i + 1}`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    unoptimized
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---------- Lightbox ---------- */}
      {lightboxOpen && !isSingle && (
        <div
          className="fixed inset-0 z-50 bg-[#2c211b]/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center text-[#f4ebe6] hover:text-white text-2xl font-light transition-colors"
            aria-label="Close lightbox"
          >
            ×
          </button>

          {/* Image count */}
          <span className="absolute top-4 left-4 text-xs text-[#f4ebe6]/60 font-mono z-50">
            {activeIndex + 1} / {sources.length}
          </span>

          {/* Lightbox image */}
          <div
            className="relative w-full h-full max-w-[90vw] max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={sources[activeIndex]}
              alt={`${title} — image ${activeIndex + 1}`}
              fill
              unoptimized
              sizes="90vw"
              className="object-contain"
            />
          </div>

          {/* Lightbox nav */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-[#f4ebe6]/10 hover:bg-[#f4ebe6]/20 text-[#f4ebe6] text-2xl transition-colors"
            aria-label="Previous image"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 w-12 h-12 flex items-center justify-center bg-[#f4ebe6]/10 hover:bg-[#f4ebe6]/20 text-[#f4ebe6] text-2xl transition-colors"
            aria-label="Next image"
          >
            ›
          </button>

          {/* Lightbox thumb strip */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {sources.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIndex(i);
                }}
                className={[
                  "w-2 h-2 transition-all",
                  i === activeIndex
                    ? "bg-[#f4ebe6] scale-125"
                    : "bg-[#f4ebe6]/40 hover:bg-[#f4ebe6]/70",
                ].join(" ")}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
