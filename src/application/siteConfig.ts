const SITE_ORIGIN = "https://matteo-vittori.netlify.app";

/** Public identity and deployment values shared by route-level presentation metadata. */
export const siteConfig = Object.freeze({
  author: "Matteo Vittori",
  defaultDescription:
    "Matteo Vittori builds modular software systems across computer vision, web products, and embedded systems.",
  defaultSocialImage: "/social-preview.png",
  locale: "en_US",
  name: "Matteo Vittori — Portfolio",
  origin: SITE_ORIGIN,
});

/** Resolves a site-relative resource or route against the canonical production origin. */
export function toCanonicalUrl(path = "/"): string {
  return new URL(path, `${SITE_ORIGIN}/`).toString();
}

/** Normalizes index-backed page routes to the trailing-slash URL served by Netlify. */
export function toCanonicalPageUrl(path = "/"): string {
  const normalizedPath = path === "/" ? path : `${path.replace(/\/+$/, "")}/`;
  return toCanonicalUrl(normalizedPath);
}
