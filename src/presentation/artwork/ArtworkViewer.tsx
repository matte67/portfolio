import { useEffect, useRef, useState } from "react";

import type { Artwork } from "../../application/artworkCatalog";

interface ArtworkViewerProps {
  readonly artwork: Artwork;
  readonly title: string;
  readonly alt: string;
  readonly labels: {
    readonly openOriginal: string;
    readonly mediaError: string;
  };
  readonly onClose: () => void;
}

/** Uses the browser's modal focus and Escape handling for full-size media. */
export function ArtworkViewer({ artwork, title, alt, labels, onClose }: ArtworkViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const trigger = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      if (trigger instanceof HTMLElement) trigger.focus({ preventScroll: true });
    };
  }, []);

  return (
    <dialog
      aria-label={title}
      className="artwork-viewer"
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      ref={dialogRef}
    >
      <div className="artwork-viewer__content">
        {failed ? (
          <div className="artwork-viewer__error" role="status">
            <p>{labels.mediaError}</p>
            <a href={artwork.source}>{labels.openOriginal}</a>
          </div>
        ) : artwork.kind === "image" ? (
          <img
            alt={alt}
            height={artwork.height}
            onError={() => setFailed(true)}
            src={artwork.source}
            width={artwork.width}
          />
        ) : (
          <video
            aria-label={title}
            autoPlay
            height={artwork.height}
            loop
            playsInline
            poster={artwork.preview}
            width={artwork.width}
          >
            <source
              onError={() => setFailed(true)}
              src={artwork.source}
              type={artwork.mimeType}
            />
          </video>
        )}
      </div>
    </dialog>
  );
}
