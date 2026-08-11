import Image, { type ImageProps } from "next/image";

type ProductImageProps = Omit<ImageProps, "src"> & { src: string };

export function resolveProductImageSources(src: string) {
  const pathnameEnd = src.search(/[?#]/);
  const pathname = src.slice(0, pathnameEnd === -1 ? src.length : pathnameEnd);
  const match = /\.(webp|png)$/i.exec(pathname);

  if (!match) return null;

  const prefix = src.slice(0, match.index);
  const suffix = src.slice(match.index + match[0].length);
  const isWebp = match[1].toLowerCase() === "webp";

  return {
    webp: isWebp ? src : `${prefix}.webp${suffix}`,
    fallback: isWebp ? `${prefix}.png${suffix}` : src,
  };
}

export function ProductImage({ src, alt, ...props }: ProductImageProps) {
  const sources = resolveProductImageSources(src);

  if (!sources) return <Image src={src} alt={alt} {...props} />;

  return (
    <picture className={props.fill ? "relative block h-full w-full" : undefined}>
      <source type="image/webp" srcSet={sources.webp} />
      <Image src={sources.fallback} alt={alt} {...props} />
    </picture>
  );
}
