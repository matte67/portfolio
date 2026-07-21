import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";

export function UseCaseList() {
  const { language } = useLanguage();
  const cases = getPageCopy(language, "editorial").useCases;

  return (
    <div className="use-case-list">
      {cases.map(([title, description], index) => (
        <details key={title} open={index === 2}>
          <summary>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{title}</strong>
            <span className="use-case-list__mark" aria-hidden="true"><FontAwesomeIcon icon={faPlus} /></span>
          </summary>
          <p>{description}</p>
        </details>
      ))}
    </div>
  );
}
