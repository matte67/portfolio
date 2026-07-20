import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { siteConfig, toCanonicalUrl } from "../../application/siteConfig";
import { useLanguage } from "../../application/i18n";

interface DocumentMetaProps {
  readonly title: string;
  readonly description?: string;
  readonly image?: string;
  readonly imageAlt?: string;
  readonly noIndex?: boolean;
  readonly type?: "article" | "website";
}

function setMetaContent(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }

  element.content = content;
}

function removeMeta(attribute: "name" | "property", key: string) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function setCanonicalLink(href: string) {
  let element = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.append(element);
  }

  element.href = href;
}

/** Keeps browser, crawler, and social metadata aligned with the active SPA route. */
export function DocumentMeta({
  title,
  description = siteConfig.defaultDescription,
  image = siteConfig.defaultSocialImage,
  imageAlt = "Matteo Vittori portfolio homepage",
  noIndex = false,
  type = "website",
}: DocumentMetaProps) {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const pageTitle = `${title} — ${siteConfig.author}`;
    const canonicalUrl = toCanonicalUrl(pathname);
    const socialImageUrl = toCanonicalUrl(image);

    document.title = pageTitle;
    setCanonicalLink(canonicalUrl);

    setMetaContent("name", "author", siteConfig.author);
    setMetaContent("name", "description", description);
    setMetaContent("name", "robots", noIndex ? "noindex, nofollow" : "index, follow");

    setMetaContent("property", "og:type", type);
    setMetaContent("property", "og:locale", language === "it" ? "it_IT" : siteConfig.locale);
    setMetaContent("property", "og:site_name", siteConfig.name);
    setMetaContent("property", "og:title", pageTitle);
    setMetaContent("property", "og:description", description);
    setMetaContent("property", "og:url", canonicalUrl);
    setMetaContent("property", "og:image", socialImageUrl);
    setMetaContent("property", "og:image:alt", imageAlt);

    if (image === siteConfig.defaultSocialImage) {
      setMetaContent("property", "og:image:width", "1200");
      setMetaContent("property", "og:image:height", "630");
    } else {
      removeMeta("property", "og:image:width");
      removeMeta("property", "og:image:height");
    }

    setMetaContent("name", "twitter:card", "summary_large_image");
    setMetaContent("name", "twitter:title", pageTitle);
    setMetaContent("name", "twitter:description", description);
    setMetaContent("name", "twitter:image", socialImageUrl);
    setMetaContent("name", "twitter:image:alt", imageAlt);
  }, [description, image, imageAlt, language, noIndex, pathname, title, type]);

  return null;
}
