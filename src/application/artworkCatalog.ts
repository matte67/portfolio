import { workJourneyMedia } from "./workJourney";

interface ArtworkMedia {
  readonly id: string;
  readonly source: string;
  readonly preview: string;
  readonly width: number;
  readonly height: number;
}

/** A gallery entry carries its original dimensions so previews keep the same framing. */
export type Artwork = ArtworkMedia & (
  | { readonly kind: "image" }
  | { readonly kind: "video"; readonly mimeType: "video/mp4" | "video/webm" }
);

export const artworkCatalog = [
  {
    id: "almost-there",
    kind: "video",
    mimeType: "video/mp4",
    source: workJourneyMedia.src,
    preview: "/media/work/opening.webp",
    width: workJourneyMedia.width,
    height: workJourneyMedia.height,
  },
  {
    id: "monk-1",
    kind: "image",
    source: "/artwork/monk-1.png",
    preview: "/artwork/previews/monk-1.webp",
    width: 1024,
    height: 1535,
  },
  {
    id: "monk-2",
    kind: "image",
    source: "/artwork/monk-2.png",
    preview: "/artwork/previews/monk-2.webp",
    width: 1536,
    height: 1024,
  },
  {
    id: "monk-4",
    kind: "image",
    source: "/artwork/monk-4.png",
    preview: "/artwork/previews/monk-4.webp",
    width: 2172,
    height: 724,
  },
  {
    id: "finally-did-it",
    kind: "image",
    source: "/artwork/finally-did-it.png",
    preview: "/artwork/previews/finally-did-it.webp",
    width: 1122,
    height: 1402,
  },
  {
    id: "life",
    kind: "image",
    source: "/artwork/life.png",
    preview: "/artwork/previews/life.webp",
    width: 1774,
    height: 887,
  },
  {
    id: "a-due-passi",
    kind: "video",
    mimeType: "video/mp4",
    source: "/media/unistays/a-due-passi.mp4",
    preview: "/media/unistays/a-due-passi-poster.webp",
    width: 720,
    height: 1280,
  },
] as const satisfies readonly Artwork[];

export type ArtworkId = (typeof artworkCatalog)[number]["id"];

