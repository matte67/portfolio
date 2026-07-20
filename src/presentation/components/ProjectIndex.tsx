import { faMinus, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { ProjectDocument } from "../../application/ports/ProjectRepository";
import { ArrowMark } from "./SmartLink";
import { PlaceholderVisual } from "../visuals/PlaceholderVisual";

interface ProjectIndexProps {
  readonly projects: readonly ProjectDocument<unknown>[];
}

export function ProjectIndex({ projects }: ProjectIndexProps) {
  const [expandedSlug, setExpandedSlug] = useState(projects[0]?.metadata.slug ?? "");

  return (
    <div className="project-index">
      {projects.map(({ metadata }) => {
        const isExpanded = expandedSlug === metadata.slug;
        const panelId = `project-preview-${metadata.slug}`;

        return (
          <article
            className={`project-row${isExpanded ? " is-expanded" : ""}`}
            data-project={metadata.slug}
            key={metadata.slug}
          >
            <div className="project-row__summary">
              <span className="project-row__index">{metadata.index}</span>
              <Link className="project-row__title" to={`/work/${metadata.slug}`}>
                <strong>{metadata.shortTitle}</strong>
                <span>{metadata.subtitle}</span>
              </Link>
              <p className="project-row__meta">{metadata.disciplines.slice(0, 2).join(" · ")} · {metadata.year}</p>
              <button
                aria-controls={panelId}
                aria-expanded={isExpanded}
                className="project-row__toggle"
                data-testid={`preview-${metadata.slug}`}
                onClick={() => setExpandedSlug(isExpanded ? "" : metadata.slug)}
                type="button"
              >
                <span className="visually-hidden">{isExpanded ? "Close" : "Preview"}</span>
                <FontAwesomeIcon aria-hidden="true" icon={isExpanded ? faMinus : faPlus} />
              </button>
            </div>
            <div className="project-row__preview" id={panelId} hidden={!isExpanded}>
              <Link className="project-row__media" to={`/work/${metadata.slug}`} aria-label={`View ${metadata.title} case study`}>
                {metadata.hero.src ? (
                  <img alt={metadata.hero.alt} decoding="async" loading="lazy" src={metadata.hero.src} />
                ) : (
                  <PlaceholderVisual />
                )}
              </Link>
              <div className="project-row__copy">
                <p>{metadata.summary}</p>
                <dl>
                  <div><dt>Role</dt><dd>{metadata.role}</dd></div>
                  <div><dt>Stack</dt><dd>{metadata.technologies.slice(0, 4).join(", ")}</dd></div>
                </dl>
                <Link className="text-link" to={`/work/${metadata.slug}`}>
                  Read case study <ArrowMark />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
