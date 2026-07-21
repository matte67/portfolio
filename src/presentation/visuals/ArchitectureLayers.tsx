
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";

export function ArchitectureLayers() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "editorial").architecture;

  return (
    <figure className="architecture-layers">
      <img src="/media/hackathon/architecture.png" alt={copy.alt} className="max-h-96 mx-auto pb-8" loading="lazy" />
      <figcaption className="text-center">{copy.caption}</figcaption>
    </figure>
  );
}
