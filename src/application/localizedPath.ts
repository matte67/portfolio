import { supportedLocales, type ContentLocale } from "../core/content";

/** Returns a URL that keeps navigation within the selected locale namespace. */
export function toLocalizedPath(path: string, language: ContentLocale): string {
  if (!path.startsWith("/")) return path;

  const [pathname, suffix = ""] = path.split(/(?=[?#])/);
  const localePrefix = new RegExp(`^/(?:${supportedLocales.join("|")})(?=/|$)`);
  const localizedPathname = localePrefix.test(pathname)
    ? pathname.replace(localePrefix, `/${language}`)
    : pathname === "/"
      ? `/${language}/`
      : `/${language}${pathname}`;

  return `${localizedPathname}${suffix}`;
}
