import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";

import { LanguageProvider, type Language } from "../application/i18n";
import { supportedLocales } from "../core/content";
import { NotFoundPage } from "../presentation/pages/NotFoundPage";

function isSupportedLanguage(value: string | undefined): value is Language {
  return supportedLocales.some((locale) => locale === value);
}

/** Establishes the locale boundary shared by every public localized route. */
export function LanguageRoute() {
  const { language } = useParams();

  if (!isSupportedLanguage(language)) {
    return (
      <LanguageProvider language="en">
        <NotFoundPage />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider language={language}>
      <Outlet />
    </LanguageProvider>
  );
}

/** Retains existing inbound links while consolidating indexing on English URLs. */
export function LegacyRouteRedirect() {
  const { "*": splat = "" } = useParams();
  const { hash, pathname, search } = useLocation();
  const path = splat ? `/${splat}` : "";
  const section = pathname.split("/").filter(Boolean)[0] ?? "";
  return <Navigate replace to={`/en/${section}${path}${search}${hash}`} />;
}
