import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { DocumentMeta } from "../components/DocumentMeta";
import { ArrowMark } from "../components/SmartLink";
import { DecryptedText } from "../effects/DecryptedText";
import { SignalField } from "../visuals/SignalField";

export function AboutPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "about");
  return (
    <>
      <DocumentMeta description={copy.meta.description} title={copy.meta.title} />
      <header className="about-hero page-shell">
        <div>
          <p className="eyebrow">{copy.hero.eyebrow}</p>
          <h1>
            {copy.hero.headingPrefix}
            <DecryptedText
              animateOn="inViewHover"
              encryptedClassName="decrypted-text__character--encrypted"
              parentClassName="text-(--color-accent)"
              revealDirection="start"
              sequential
              speed={175}
              text={copy.hero.headingEmphasis}
            />{" "}
            {copy.hero.headingSuffix}
          </h1>
          <p>{copy.hero.description}</p>
        </div>
        <SignalField />
      </header>
      <section className="about-story page-shell section-space">
        <div><p className="eyebrow">{copy.approach.eyebrow}</p><h2>{copy.approach.title}</h2></div>
        <div>
          {copy.approach.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className="about-story__links">
            <a className="button-link" href="/documents/matteo-vittori-cv.pdf">{copy.approach.cv} <ArrowMark /></a>
            <a className="text-link" href="mailto:matteo01.vittori@icloud.com">{copy.approach.contact} <ArrowMark /></a>
          </div>
        </div>
      </section>
      <section className="principles page-shell section-space" aria-labelledby="principles-title">
        <header><p className="eyebrow">{copy.principles.eyebrow}</p><h2 id="principles-title">{copy.principles.title}</h2></header>
        <div>
          {copy.principles.items.map((principle) => (
            <article key={principle.number}><span>{principle.number}</span><h3>{principle.title}</h3><p>{principle.description}</p></article>
          ))}
        </div>
      </section>
      <section className="education page-shell section-space">
        <div><p className="eyebrow">{copy.education.eyebrow}</p><h2>{copy.education.title}</h2></div>
        <dl>
          <div><dt>{copy.education.programmeLabel}</dt><dd>{copy.education.programme}</dd></div>
          <div><dt>{copy.education.graduationLabel}</dt><dd>{copy.education.graduation}</dd></div>
          <div><dt>{copy.education.thesisLabel}</dt><dd>{copy.education.thesis}</dd></div>
          <div><dt>{copy.education.languagesLabel}</dt><dd>{copy.education.languages.map((item) => <span className="block" key={item}>{item}</span>)}</dd></div>
        </dl>
      </section>
    </>
  );
}
