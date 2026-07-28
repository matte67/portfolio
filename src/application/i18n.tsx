import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { ContentLocale } from "../core/content";
import { toLocalizedPath } from "./localizedPath";

export type Language = ContentLocale;

interface LanguageContextValue {
  readonly language: Language;
  readonly setLanguage: (language: Language) => void;
  readonly toLocalizedPath: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Provides a URL-derived language and changes locale without losing the current page. */
export function LanguageProvider({
  children,
  language,
}: {
  readonly children: ReactNode;
  readonly language: Language;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    setLanguage(nextLanguage: Language) {
      if (nextLanguage === language) return;
      navigate(toLocalizedPath(`${location.pathname}${location.search}${location.hash}`, nextLanguage));
    },
    toLocalizedPath: (path: string) => toLocalizedPath(path, language),
  }), [language, location.hash, location.pathname, location.search, navigate]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Reads the current language. It must be used beneath LanguageProvider. */
// This hook intentionally shares the provider module so its context remains private.
// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider.");
  return context;
}
