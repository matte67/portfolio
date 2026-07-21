import { projectCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { DecryptedText } from "../effects/DecryptedText";
import { EditorialIndex, type EditorialIndexItem } from "../editorial/EditorialIndex";
import { PlaceholderVisual } from "../visuals/PlaceholderVisual";

export function WorkPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "work");
  const projects = projectCatalog.listProjects(language);
  const items: EditorialIndexItem[] = projects.map(({ metadata }) => ({
    ariaLabel: `${copy.view} ${metadata.title}`,
    eyebrow: `${metadata.index} · ${metadata.year}`,
    href: `/work/${metadata.slug}`,
    media: {
      alt: metadata.hero.alt,
      fallback: <PlaceholderVisual />,
      src: metadata.hero.src,
    },
    metadata: [metadata.role, metadata.disciplines.join(" · ")],
    summary: metadata.summary,
    title: metadata.title,
  }));

  return (
    <>
      <DocumentMeta description={copy.meta.description} title={copy.meta.title} />
      <header className="page-intro page-shell">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>
          {copy.headingPrefix}
          <DecryptedText
            animateOn="inViewHover"
            encryptedClassName="decrypted-text__character--encrypted"
            parentClassName="text-(--color-accent)"
            revealDirection="start"
            sequential
            speed={165}
            text={copy.headingEmphasis}
          />
        </h1>
        <p className="pt-4">{copy.description}</p>
      </header>
      <EditorialIndex
        items={items}
        readLabel={copy.read}
        sectionLabel={copy.sectionLabel}
      />
    </>
  );
}
