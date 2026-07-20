import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { ContentLocale } from "../core/content";

export type Language = ContentLocale;

interface LanguageContextValue {
  readonly language: Language;
  readonly setLanguage: (language: Language) => void;
}

const LANGUAGE_STORAGE_KEY = "portfolio-language";
const LanguageContext = createContext<LanguageContextValue | null>(null);

/** Provides the active interface language and remembers a visitor's choice. */
export function LanguageProvider({ children }: { readonly children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage === "it" ? "it" : "en";
  });

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);
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
