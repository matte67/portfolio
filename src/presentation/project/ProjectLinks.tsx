import type { ProjectLink } from "../../core/project";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { ArrowMark, SmartLink } from "../components/SmartLink";

interface ProjectLinksProps {
  readonly links: readonly ProjectLink[];
}

export function ProjectLinks({ links }: ProjectLinksProps) {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "project");
  return (
    <div className="project-links" aria-label={copy.links}>
      {links.map((link) =>
        link.href ? (
          <SmartLink className="project-link" href={link.href} key={link.label}>
            <span>{link.label}</span>
            <ArrowMark />
          </SmartLink>
        ) : (
          <span className="project-link project-link--disabled" aria-disabled="true" key={link.label}>
            <span>{link.label}</span>
            <span aria-hidden="true">—</span>
          </span>
        ),
      )}
    </div>
  );
}
