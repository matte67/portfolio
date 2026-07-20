interface ProjectFigureProps {
  readonly src: string;
  readonly alt: string;
  readonly caption: string;
  readonly wide?: boolean;
}

export function ProjectFigure({ src, alt, caption, wide = false }: ProjectFigureProps) {
  return (
    <figure className={`project-figure${wide ? " project-figure--wide" : ""}`}>
      <div className="project-figure__media">
        <img src={src} alt={alt} loading="lazy" />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

interface GalleryItem {
  readonly src: string;
  readonly alt: string;
}

interface ProjectGalleryProps {
  readonly items: readonly GalleryItem[];
}

export function ProjectGallery({ items }: ProjectGalleryProps) {
  return (
    <figure className="project-gallery">
      {items.map((item, index) => (
        <div className={`${index === 0 ? "hidden! md:block!" : ""}  project-gallery__item project-gallery__item--${index + 1}`} key={item.src}>
          <img src={item.src} alt={item.alt} loading="lazy" />
        </div>
      ))}
      <figcaption>Responsive UniStays product views across desktop, tablet, and mobile.</figcaption>
    </figure>
  );
}
