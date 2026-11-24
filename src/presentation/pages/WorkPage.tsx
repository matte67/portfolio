import { projectCatalog } from "../../app/dependencies";
import { projectYears } from "../../application/editorialSearch";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { DecryptedText } from "../effects/DecryptedText";
import { SearchableEditorialIndex, type SearchableEditorialItem } from "../editorial/SearchableEditorialIndex";
import { ProjectLogo } from "../project/ProjectLogo";
import { PlaceholderVisual } from "../visuals/PlaceholderVisual";

export function WorkPage() {
  const { language, toLocalizedPath } = useLanguage();
  const copy = getPageCopy(language, "work");
  const projects = projectCatalog.listProjects(language);
  const items: SearchableEditorialItem[] = projects.map(({ metadata }) => ({
    ariaLabel: `${copy.view} ${metadata.title}`,
    brand: metadata.logo ? <ProjectLogo decorative logo={metadata.logo} /> : undefined,
    eyebrow: `${metadata.index} · ${metadata.year}`,
    href: toLocalizedPath(`/work/${metadata.slug}`),
    media: {
      alt: metadata.hero.alt,
      fallback: <PlaceholderVisual />,
      src: metadata.chip,
    },
    metadata: [metadata.role, metadata.disciplines.join(" · ")],
    search: {
      featured: metadata.featured,
      tags: metadata.disciplines,
      terms: [metadata.title, metadata.subtitle, metadata.summary, metadata.year, ...metadata.technologies],
      years: projectYears(metadata.year),
    },
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
      <SearchableEditorialIndex
        items={items}
        mode="roller"
        readLabel={copy.read}
        searchLabel={copy.searchLabel}
        sectionLabel={copy.sectionLabel}
        showFeaturedFilter
      />
    </>
  );
}
