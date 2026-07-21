import type { ReactNode } from "react";

interface EditorialImageProps {
  readonly alt: string;
  readonly className?: string;
  readonly fill?: boolean;
  readonly priority?: boolean;
  readonly src: string;
}

/** One image implementation for cards, heroes, figures, and galleries. */
export function EditorialImage({
  alt,
  className = "",
  fill = false,
  priority = false,
  src,
}: EditorialImageProps) {
  return (
    <img
      alt={alt}
      className={["editorial-image", fill ? "editorial-image--fill" : "", className]
        .filter(Boolean).join(" ")}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      loading={priority ? "eager" : "lazy"}
      src={src}
    />
  );
}

interface EditorialFigureProps {
  readonly src: string;
  readonly alt: string;
  readonly caption?: ReactNode;
  readonly credit?: ReactNode;
  readonly fill?: boolean;
  readonly wide?: boolean;
  readonly priority?: boolean;
  readonly className?: string;
}

/**
 * Shared media primitive for articles and project case studies.
 * Keeping the caption and credit next to the image makes MDX content
 * accessible and gives every editorial page the same visual rhythm.
 */
export function EditorialFigure({
  alt,
  caption,
  className = "",
  credit,
  fill = false,
  priority = false,
  src,
  wide = false,
}: EditorialFigureProps) {
  const figureClassName = [
    "editorial-figure",
    wide ? "editorial-figure--wide" : "",
    className,
  ].filter(Boolean).join(" ");

  return (
    <figure className={figureClassName}>
      <div className="editorial-figure__media">
        <EditorialImage
          alt={alt}
          fill={fill}
          priority={priority}
          src={src}
        />
      </div>
      {caption || credit ? (
        <figcaption>
          {caption ? <span>{caption}</span> : null}
          {credit ? <small>{credit}</small> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}

export interface EditorialGalleryItem {
  readonly src: string;
  readonly alt: string;
}

interface EditorialGalleryProps {
  readonly items: readonly EditorialGalleryItem[];
  readonly caption?: ReactNode;
  readonly className?: string;
}

/** Responsive gallery primitive shared by product and editorial content. */
export function EditorialGallery({ items, caption, className = "" }: EditorialGalleryProps) {
  const galleryClassName = ["editorial-gallery", className].filter(Boolean).join(" ");

  return (
    <figure className={galleryClassName}>
      {items.map((item, index) => (
        <div
          className={`editorial-gallery__item editorial-gallery__item--${index + 1}`}
          key={item.src}
        >
          <EditorialImage alt={item.alt} fill src={item.src} />
        </div>
      ))}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
