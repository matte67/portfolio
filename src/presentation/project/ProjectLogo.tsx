import type { ProjectLogo as ProjectLogoMetadata } from "../../core/project";

interface ProjectLogoProps {
  readonly decorative?: boolean;
  readonly logo: ProjectLogoMetadata;
}

/** Renders a project's visual identity without coupling its source to a page layout. */
export function ProjectLogo({ decorative = false, logo }: ProjectLogoProps) {
  return (
    <span className="project-logo">
      <img
        alt={decorative ? "" : logo.alt}
        decoding="async"
        loading="eager"
        src={logo.src}
      />
    </span>
  );
}
