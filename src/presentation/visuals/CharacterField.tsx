import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";

const characters = [
  "/media/rewild/fawn.avif",
  "/media/rewild/bird.avif",
  "/media/rewild/dolphin.avif",
  "/media/rewild/tortue.avif",
] as const;

export function CharacterField() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "editorial").character;

  return (
    <figure className="character-field">
      <div className="character-field__copy flex flex-col gap-4">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h3>{copy.title}</h3>
        <p>{copy.description}</p>
      </div>
      <div className="character-field__animals" aria-label={copy.ariaLabel}>
        {characters.map((src, index) => <img alt={copy.alts[index]} key={src} loading="lazy" src={src} />)}
      </div>
      <figcaption>{copy.caption}</figcaption>
    </figure>
  );
}
