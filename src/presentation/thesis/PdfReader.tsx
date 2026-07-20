import { useState } from "react";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import {
  ArrowMark,
  DownloadMark,
  NextMark,
  PreviousMark,
} from "../components/SmartLink";

const PDF_URL = "/documents/thesis-matteo-vittori.pdf";
const PAGE_COUNT = 89;

export function PdfReader() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "thesis").reader;
  const [page, setPage] = useState(1);
  const setSafePage = (nextPage: number) => setPage(Math.min(PAGE_COUNT, Math.max(1, nextPage)));

  return (
    <section className="pdf-reader" aria-labelledby="pdf-reader-title">
      <header className="pdf-reader__header">
        <div>
          <p className="eyebrow">{copy.eyebrow}</p>
          <h2 id="pdf-reader-title">{copy.title}</h2>
        </div>
        <div className="pdf-reader__links">
          <a href={PDF_URL} target="_blank" rel="noreferrer">{copy.open} <ArrowMark /></a>
          <a href={PDF_URL} download>{copy.download} <DownloadMark /></a>
        </div>
      </header>

      <div className="pdf-reader__desktop">
        <iframe
          key={page}
          src={`${PDF_URL}#page=${page}&zoom=80&toolbar=0`}
          title={`${copy.title}, ${copy.pageNumber.toLowerCase()} ${page} ${copy.of} ${PAGE_COUNT}`}
        />
      </div>

      <div className="pdf-reader__toolbar hidden! md:flex!" aria-label={copy.controlsLabel}>
          <button disabled={page === 1} onClick={() => setSafePage(page - 1)} type="button"><PreviousMark /></button>
          <label>
            <span className="visually-hidden">{copy.pageNumber}</span>
                    <span className="text-(--color-ink)">{page} {copy.of} {PAGE_COUNT}</span>

          </label>
          <button disabled={page === PAGE_COUNT} onClick={() => setSafePage(page + 1)} type="button"><NextMark /></button>
        </div>

      <div className="pdf-reader__mobile">
        <img alt={copy.coverAlt} loading="lazy" src="/media/thesis/cover.png" />
        <div className="flex flex-col gap-4">
          <h3>{copy.mobileTitle}</h3>
          <p>{copy.mobileDescription}</p>
          <a className="button-link" href={PDF_URL} target="_blank" rel="noreferrer">{copy.mobileOpen} <ArrowMark /></a>
        </div>
      </div>
    </section>
  );
}
