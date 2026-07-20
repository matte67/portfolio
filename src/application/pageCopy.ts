import type { Language } from "./i18n";

import aboutEn from "../../content/i18n/en/about.json";
import articleEn from "../../content/i18n/en/article.json";
import articlesEn from "../../content/i18n/en/articles.json";
import homeEn from "../../content/i18n/en/home.json";
import layoutEn from "../../content/i18n/en/layout.json";
import notFoundEn from "../../content/i18n/en/not-found.json";
import projectEn from "../../content/i18n/en/project.json";
import thesisEn from "../../content/i18n/en/thesis.json";
import thesisPreviewEn from "../../content/i18n/en/thesis-preview.json";
import workEn from "../../content/i18n/en/work.json";
import aboutIt from "../../content/i18n/it/about.json";
import articleIt from "../../content/i18n/it/article.json";
import articlesIt from "../../content/i18n/it/articles.json";
import homeIt from "../../content/i18n/it/home.json";
import layoutIt from "../../content/i18n/it/layout.json";
import notFoundIt from "../../content/i18n/it/not-found.json";
import projectIt from "../../content/i18n/it/project.json";
import thesisIt from "../../content/i18n/it/thesis.json";
import thesisPreviewIt from "../../content/i18n/it/thesis-preview.json";
import workIt from "../../content/i18n/it/work.json";

const pageCopy = {
  en: { about: aboutEn, article: articleEn, articles: articlesEn, home: homeEn, layout: layoutEn, notFound: notFoundEn, project: projectEn, thesis: thesisEn, thesisPreview: thesisPreviewEn, work: workEn },
  it: { about: aboutIt, article: articleIt, articles: articlesIt, home: homeIt, layout: layoutIt, notFound: notFoundIt, project: projectIt, thesis: thesisIt, thesisPreview: thesisPreviewIt, work: workIt },
} as const;

export type PageCopyName = keyof typeof pageCopy.en;

/** Retrieves copy for one page and one supported locale. */
export function getPageCopy<Page extends PageCopyName>(language: Language, page: Page): (typeof pageCopy)[Language][Page] {
  return pageCopy[language][page];
}
