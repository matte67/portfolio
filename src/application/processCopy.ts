import en from "../../content/i18n/en/process.json";
import it from "../../content/i18n/it/process.json";
import type { Language } from "./i18n";

/** Returns the localized production notes and interface copy. */
export function getProcessCopy(language: Language) {
  return language === "it" ? it : en;
}
