import type { ProjectMetadata } from "../core/project";
import type { Language } from "./i18n";
import { toLocalizedPath } from "./localizedPath";
import { getPageCopy } from "./pageCopy";

const MEDIA_ROOT = "/media/work";

export const workJourneyMedia = {
  src: `${MEDIA_ROOT}/almost-there.mp4`,
  width: 1280,
  height: 720,
  fps: 24,
  lastFrame: 287,
} as const;

// Zero-based marks from the final video. The matching stills use the same frames.
const stops = [
  { id: "opening", frame: 0, focusX: 0.5, projects: [] },
  { id: "childhood", frame: 14, focusX: 0.29, projects: [] },
  { id: "amandola", frame: 45, focusX: 0.70, projects: ["spazio"] },
  { id: "camerino", frame: 70, focusX: 0.25, projects: ["dormant-access-control-unit", "rewild", "hackathon-management-system"] },
  { id: "unistays", frame: 100, focusX: 0.73, projects: ["unistays"] },
  { id: "graduation", frame: 131, focusX: 0.29, projects: ["sef"] },
  { id: "nodale", frame: 159, focusX: 0.77, projects: ["boccone", "spesino", "nodale"] },
  { id: "prenivo", frame: 191, focusX: 0.27, projects: ["prenivo"] },
  { id: "polimi", frame: 219, focusX: 0.75, projects: [] },
  { id: "temple", frame: workJourneyMedia.lastFrame, focusX: 0.5, projects: [] },
] as const;

export interface WorkJourneyProject {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly href?: string;
}

export interface WorkJourneyStop {
  readonly id: string;
  readonly frame: number;
  readonly focusX: number;
  readonly label: string;
  readonly poster: string;
  readonly projects: readonly WorkJourneyProject[];
}

/** Pairs the approved video marks with localized copy and routes available in the current catalog. */
export function getWorkJourney(language: Language, projects: readonly ProjectMetadata[]): readonly WorkJourneyStop[] {
  const { stops: labels, projects: descriptions } = getPageCopy(language, "work");
  const projectsById = new Map(projects.map((project) => [project.translationKey, project]));

  return stops.map(({ id, frame, focusX, projects: projectIds }) => ({
    id,
    frame,
    focusX,
    label: labels[id],
    poster: `${MEDIA_ROOT}/${id}.webp`,
    projects: projectIds.map((projectId) => {
      const project = projectsById.get(projectId);
      const { title, summary } = descriptions[projectId];

      return {
        id: projectId,
        title,
        summary,
        href: project && toLocalizedPath(`/work/${project.slug}`, language),
      };
    }),
  }));
}
