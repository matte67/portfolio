import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";

import { projectCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { SectionHeading } from "../components/SectionHeading";
import { ArrowMark, DownMark } from "../components/SmartLink";
import { DecryptedText } from "../effects/DecryptedText";
import { ThesisPreview } from "../thesis/ThesisPreview";
import { MagneticAvatar } from "../visuals/MagneticAvatar";
import { SignalField } from "../visuals/SignalField";

const FlowingMenu = lazy(() => import("../components/FlowingMenu"));

export function HomePage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "home");
  const projects = projectCatalog.listFeaturedProjects(language);
  const selectedProjectItems = projects.map(({ metadata }) => ({
    image: metadata.chip || "/global/matteo-vittori-mark.svg",
    link: `/work/${metadata.slug}`,
    meta: `${metadata.disciplines.slice(0, 2).join(" · ")} · ${metadata.year}`,
    text: metadata.shortTitle,
  }));

  return (
    <>
      <DocumentMeta
        description={copy.meta.description}
        title={copy.meta.title}
      />
      <section
        className="home-hero page-shell relative"
        aria-labelledby="home-title"
      >
        <div className="home-hero__visual relative overflow-hidden text-(--color-accent)  min-h-[calc(100svh-4.5rem)]">
          <SignalField animateEntrance />
          <div className="home-hero__copy pointer-events-none absolute inset-0 md:pl-20 z-1 flex items-start  md:items-center justify-center">
            <h1
              className="m-0 flex w-full max-w-none items-center justify-center gap-[clamp(29rem,27vw,27rem)] whitespace-nowrap text-center text-[clamp(4.5rem,7vw,7rem)] leading-[0.86] font-[590] tracking-[-0.065em] uppercase max-[70rem]:gap-[clamp(17rem,31vw,20rem)] max-[70rem]:text-[clamp(2rem,7vw,5.25rem)] max-[70rem]:pt-4 max-[48rem]:flex-col max-[48rem]:gap-[clamp(4.5rem,18vw,13rem)] max-[48rem]:whitespace-normal max-[48rem]:text-[clamp(2.6rem,16vw,4.6rem)]"
              id="home-title"
            >
              <span className="text-(--color-ink)">{copy.heroGreeting}</span>
              <em className="text-(--color-accent-dark) not-italic">
                <DecryptedText
                  animateOn="inViewHover"
                  encryptedClassName="decrypted-text__character--encrypted"
                  parentClassName="home-hero__decrypted-name"
                  revealDirection="start"
                  sequential
                  speed={165}
                  text="Matteo"
                />
              </em>
            </h1>
          </div>
          <MagneticAvatar />
          <div className="home-hero__actions absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 flex-wrap items-center justify-center gap-6 whitespace-nowrap max-[48rem]:bottom-4 max-[25rem]:w-[calc(100%-2.5rem)] max-[25rem]:flex-col max-[25rem]:items-stretch">
            <a className="button-link" href="#selected-work">{copy.exploreWork} <DownMark /></a>
            <a className="text-link" href="mailto:matteo01.vittori@icloud.com">{copy.email} <ArrowMark /></a>
          </div>
        </div>
      </section>

      <section className="selected-work page-shell section-space" id="selected-work" aria-labelledby="selected-work-title">
        <SectionHeading
          eyebrow={copy.work.eyebrow}
          title={copy.work.title}
          description={copy.work.description}
        />
        <Suspense fallback={<div aria-hidden="true" className="flowing-menu-fallback" />}>
          <FlowingMenu
            bgColor="transparent"
            borderColor="#00000000"
            items={selectedProjectItems}
            marqueeBgColor="var(--color-ink)"
            marqueeTextColor="var(--color-canvas)"
            textColor="var(--color-ink)"
            speed={10}
          />
        </Suspense>
        <Link className="section-end-link" to="/work">{copy.work.indexLink} <ArrowMark /></Link>
      </section>

      <section className="about-preview page-shell section-space" aria-labelledby="about-preview-title">
        <div>
          <p className="eyebrow">{copy.about.eyebrow}</p>
          <h2 id="about-preview-title">{copy.about.title}</h2>
        </div>
        <div className="about-preview__copy">
          <p>
            {copy.about.paragraphs[0]}
          </p>
          <p>
            {copy.about.paragraphs[1]}
          </p>
          <Link className="text-link" to="/about">{copy.about.link} <ArrowMark /></Link>
        </div>
      </section>

      <ThesisPreview />
    </>
  );
}
