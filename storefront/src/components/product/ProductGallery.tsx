import Image from "next/image";
import type { ProductImage } from "./types";

interface ProductGalleryProps {
  images: ProductImage[] | null | undefined;
  thumbnail?: string | null;
  title: string;
}

export function ProductGallery({
  images,
  thumbnail,
  title,
}: ProductGalleryProps) {
  const sources: string[] = [];

  // Thumbnail first if present (Medusa often returns it as a URL string).
  if (thumbnail) {
    sources.push(thumbnail);
  }

  // Append all gallery images.
  if (images && images.length > 0) {
    for (const img of images) {
      if (img.url && !sources.includes(img.url)) {
        sources.push(img.url);
      }
    }
  }

  // No images at all — render a placeholder.
  if (sources.length === 0) {
    return (
      <div className="aspect-[4/5] bg-[#e8ddd6] flex items-center justify-center">
        <span className="text-[#2c211b]/40 text-sm font-medium uppercase tracking-widest">
          {title}
        </span>
      </div>
    );
  }

  // Single image: simple full-width render.
  if (sources.length === 1) {
    return (
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f4ebe6]">
        <Image
          src={sources[0]}
          alt={title}
          fill
          priority
          unoptimized
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    );
  }

  // Multiple images: horizontal scroll strip with first image full-width above.
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f4ebe6]">
        <Image
          src={sources[0]}
          alt={`${title} — изображение 1`}
          fill
          priority
          unoptimized
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sources.map((src, i) => (
          <button
            key={src}
            type="button"
            className="relative flex-shrink-0 w-20 h-20 overflow-hidden bg-[#f4ebe6] border-2 border-transparent hover:border-[#2f6f78] focus:border-[#2f6f78] transition-colors"
            aria-label={`${title} — изображение ${i + 1}`}
          >
            <Image
              src={src}
              alt=""
              fill
              unoptimized
              sizes="80px"
              className="object-cover"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
