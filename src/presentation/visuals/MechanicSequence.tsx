import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";

export function MechanicSequence() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "editorial").mechanicSequence;

  return (
    <ol className="mechanic-sequence" aria-label={copy.ariaLabel}>
      {copy.phases.map(([number, title, description]) => (
        <li key={number}>
          <span>{number}</span>
          <strong>{title}</strong>
          <p>{description}</p>
        </li>
      ))}
    </ol>
  );
}
