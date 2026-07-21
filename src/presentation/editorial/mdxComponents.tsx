import type { MDXComponents } from "mdx/types";

import { ContentNeeded } from "../project/ContentNeeded";
import { ProjectFigure, ProjectGallery } from "../project/ProjectFigure";
import { AccessPoints } from "../visuals/AccessPoints";
import { ArchitectureLayers } from "../visuals/ArchitectureLayers";
import { BenchmarkPanel } from "../visuals/BenchmarkPanel";
import { CharacterField } from "../visuals/CharacterField";
import { MechanicSequence } from "../visuals/MechanicSequence";
import { PipelineExplorer } from "../visuals/PipelineExplorer";
import { UseCaseList } from "../visuals/UseCaseList";
import { EditorialCallout, EditorialFlow, EditorialQuote } from "./EditorialPrimitives";
import { EditorialImage, EditorialPre } from "./mdxElements";
import { EditorialFigure, EditorialGallery } from "./EditorialMedia";

/**
 * MDX component registry shared by articles and project case studies.
 * Existing project visuals remain available while new editorial primitives
 * make future content expressive without page-specific JSX.
 */
export const editorialMdxComponents: MDXComponents = {
  AccessPoints,
  ArchitectureLayers,
  BenchmarkPanel,
  CharacterField,
  ContentNeeded,
  EditorialCallout,
  EditorialFigure,
  EditorialFlow,
  EditorialGallery,
  EditorialQuote,
  MechanicSequence,
  PipelineExplorer,
  ProjectFigure,
  ProjectGallery,
  UseCaseList,
  blockquote: EditorialQuote,
  img: EditorialImage,
  pre: EditorialPre,
};
