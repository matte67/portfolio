import type { MDXComponents } from "mdx/types";

import { ContentNeeded } from "./ContentNeeded";
import { ProjectFigure, ProjectGallery } from "./ProjectFigure";
import { AccessPoints } from "../visuals/AccessPoints";
import { ArchitectureLayers } from "../visuals/ArchitectureLayers";
import { BenchmarkPanel } from "../visuals/BenchmarkPanel";
import { CharacterField } from "../visuals/CharacterField";
import { MechanicSequence } from "../visuals/MechanicSequence";
import { PipelineExplorer } from "../visuals/PipelineExplorer";
import { UseCaseList } from "../visuals/UseCaseList";

export const projectMdxComponents: MDXComponents = {
  AccessPoints,
  ArchitectureLayers,
  BenchmarkPanel,
  CharacterField,
  ContentNeeded,
  MechanicSequence,
  PipelineExplorer,
  ProjectFigure,
  ProjectGallery,
  UseCaseList,
};
