import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faEnvelope, faFileLines } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { ArrowMark, SmartLink } from "../components/SmartLink";
import { FooterMergeCorner } from "./FooterMergeCorner";

export function SiteFooter() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "layout").footer;
  return (
    <footer className="site-footer">
      <FooterMergeCorner side="left" />
      <FooterMergeCorner side="right" />
      <div className="page-shell">

        <div className="site-footer__grid">
          <div className="site-footer__intro">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
            <a className="footer-email" href="mailto:matteo01.vittori@icloud.com">
              <FontAwesomeIcon aria-hidden="true" icon={faEnvelope} />
              <span>matteo01.vittori@icloud.com</span>
              <ArrowMark />
            </a>
          </div>

          <nav className="site-footer__links" aria-label={copy.linksLabel}>
            <p>{copy.explore}</p>
            <ul>
              <li><SmartLink href="/documents/matteo-vittori-cv.pdf"><span>CV</span><FontAwesomeIcon aria-hidden="true" icon={faFileLines} /></SmartLink></li>
              <li><SmartLink href="https://github.com/matte67"><span>GitHub</span><FontAwesomeIcon aria-hidden="true" icon={faGithub} /></SmartLink></li>
            </ul>
          </nav>

          <div className="site-footer__meta">
            <p>{copy.details}</p>
            <dl>
              <div><dt>{copy.role}</dt><dd>{copy.roleValue}</dd></div>
              <div><dt>{copy.based}</dt><dd>Camerino, Italy</dd></div>
              <div><dt>{copy.timezone}</dt><dd>CET / CEST</dd></div>
            </dl>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>© {new Date().getFullYear()} Matteo Vittori</span>
          <span>{copy.signature}</span>
        </div>
      </div>
    </footer>
  );
}
