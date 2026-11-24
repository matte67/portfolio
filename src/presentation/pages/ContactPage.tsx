import type { FormEvent } from "react";
import english from "../../../content/i18n/en/contact.json";
import italian from "../../../content/i18n/it/contact.json";
import { useLanguage } from "../../application/i18n";
import { DocumentMeta } from "../components/DocumentMeta";
import { DecryptedText } from "../effects/DecryptedText";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import "./ContactPage.css";

const recipient = "matteo01.vittori@icloud.com";

/** Opens a reviewable email draft from the visitor’s project brief. */
export function ContactPage() {
  const { language } = useLanguage();
  const copy = language === "it" ? italian : english;

  function compose(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const subject = fields.get("service") + " · " + fields.get("name");
    const body = String(fields.get("details")).trim() + "\n\n" + String(fields.get("name")).trim();
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <section className="contact-page page-shell section-space">
      <DocumentMeta title={copy.meta.title} description={copy.meta.description} />
      <header>
        <h1>{copy.headingPrefix}{" "}
          <DecryptedText animateOn="inViewHover" sequential revealDirection="start" speed={165}
            encryptedClassName="decrypted-text__character--encrypted"
            parentClassName="text-(--color-accent)" text={copy.headingEmphasis} />
        </h1>
        <p>{copy.intro}</p>
      </header>
      <form onSubmit={compose}>
        <label>{copy.name}<input name="name" autoComplete="name" required maxLength={100} /></label>
        <fieldset><legend>{copy.service}</legend>
          <div className="contact-services">{copy.services.map((service) => (
            <label key={service}><input type="radio" name="service" value={service} required />{service}</label>
          ))}</div>
        </fieldset>
        <label>{copy.details}<textarea name="details" rows={5} required maxLength={2500} /></label>
        <div><button className="button-link" type="submit">{copy.submit} <FontAwesomeIcon icon={faEnvelope} aria-hidden="true" /></button></div>
      </form>
    </section>
  );
}
