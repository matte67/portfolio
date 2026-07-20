import { Link } from "react-router-dom";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { SignalField } from "../visuals/SignalField";

export function NotFoundPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "notFound");
  return (
    <section className="not-found page-shell">
      <DocumentMeta noIndex title={copy.metaTitle} />
      <div>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <Link className="button-link" to="/">{copy.returnHome}</Link>
      </div>
      <SignalField />
    </section>
  );
}
