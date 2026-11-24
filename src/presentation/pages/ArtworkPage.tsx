import { useState, type PointerEvent } from "react";

import { artworkCatalog, type ArtworkId } from "../../application/artworkCatalog";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { ArtworkViewer } from "../artwork/ArtworkViewer";
import { DocumentMeta } from "../components/DocumentMeta";
import "./ArtworkPage.css";

function playOnHover(event: PointerEvent<HTMLButtonElement>) {
  if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Loading stays on demand, and playback may be denied by the browser.
  void event.currentTarget.querySelector("video")?.play().catch(() => {});
}

/** Presents the creative work at its original aspect ratio. */
export function ArtworkPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "artwork");
  const [selectedId, setSelectedId] = useState<ArtworkId | null>(null);
  const selected = artworkCatalog.find((entry) => entry.id === selectedId);

  return (
    <>
      <DocumentMeta {...copy.meta} />
      <section className="artwork page-shell" aria-labelledby="artwork-title">
        <header className="artwork__intro">
          <h1 id="artwork-title">{copy.meta.title}</h1>
          <p>{copy.intro}</p>
        </header>

        <ul className="artwork__grid" role="list">
          {artworkCatalog.map((entry) => (
            <li className="artwork__item" key={entry.id}>
              <button
                aria-haspopup="dialog"
                aria-label={copy.items[entry.id].title}
                className="artwork__tile"
                onClick={(event) => {
                  event.currentTarget.querySelector("video")?.pause();
                  setSelectedId(entry.id);
                }}
                onPointerEnter={entry.kind === "video" ? playOnHover : undefined}
                onPointerLeave={entry.kind === "video"
                  ? (event) => event.currentTarget.querySelector("video")?.pause()
                  : undefined}
                type="button"
              >
                <span className="artwork__media">
                  {entry.kind === "image" ? (
                    <img
                      alt=""
                      decoding="async"
                      height={entry.height}
                      loading="lazy"
                      src={entry.preview}
                      width={entry.width}
                    />
                  ) : (
                    <video
                      aria-hidden="true"
                      height={entry.height}
                      loop
                      muted
                      playsInline
                      poster={entry.preview}
                      preload="none"
                      width={entry.width}
                    >
                      <source src={entry.source} type={entry.mimeType} />
                    </video>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected && (
        <ArtworkViewer
          alt={copy.items[selected.id].alt}
          artwork={selected}
          key={selected.id}
          labels={copy}
          onClose={() => setSelectedId(null)}
          title={copy.items[selected.id].title}
        />
      )}
    </>
  );
}
