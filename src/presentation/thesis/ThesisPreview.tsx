import { Link } from "react-router-dom";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { ArrowMark, DownloadMark } from "../components/SmartLink";

export function ThesisPreview() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "thesisPreview");
  return (
    <section className="thesis-preview page-shell" aria-labelledby="thesis-preview-title">
      <div className="thesis-preview__cover">
        <img
          alt={copy.coverAlt}
          loading="lazy"
          src="/media/thesis/cover.png"
        />
      </div>
      <div className="thesis-preview__content">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="thesis-preview-title">{copy.title}</h2>
        <p className="pt-3">
          {copy.description}
        </p>
        <ul>
          {copy.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <div className="thesis-preview__links">
          <Link className="button-link" to="/thesis">{copy.read} <ArrowMark /></Link>
          <a className="text-link" download href="/documents/thesis-matteo-vittori.pdf">{copy.download} <DownloadMark /></a>
        </div>
      </div>
    </section>
  );
}
