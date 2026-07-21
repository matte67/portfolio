import type { ComponentProps } from "react";

import { EditorialFigure, EditorialGallery } from "../editorial/EditorialMedia";

type ProjectFigureProps = ComponentProps<typeof EditorialFigure>;

/** Backwards-compatible project alias for the shared editorial figure. */
export function ProjectFigure(props: ProjectFigureProps) {
  return <EditorialFigure {...props} />;
}

type ProjectGalleryProps = ComponentProps<typeof EditorialGallery>;

/** Backwards-compatible project alias for the shared editorial gallery. */
export function ProjectGallery(props: ProjectGalleryProps) {
  return <EditorialGallery {...props} />;
}
