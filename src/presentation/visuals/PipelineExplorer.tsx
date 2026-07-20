import { useState } from "react";

const stages = [
  { name: "Frame extractor", detail: "Acquires frames from a file, camera, or continuous source." },
  { name: "Frame processor", detail: "Transforms visual data through independent, replaceable operations." },
  { name: "Signal extractor", detail: "Turns frames into measures, trajectories, motion, or temporal series." },
  { name: "Signal cleaner", detail: "Filters, normalises, and corrects the extracted signal." },
  { name: "Analyzer", detail: "Interprets structured signals and produces analytical results." },
  { name: "Visualizer", detail: "Creates plots, media, tables, or inspectable artifacts." },
] as const;

export function PipelineExplorer() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStage = stages[activeIndex];

  return (
    <section className="pipeline-explorer" aria-labelledby="pipeline-explorer-title">
      <header className="pipeline-explorer__header">
        <p className="eyebrow">Interactive model</p>
        <h3 id="pipeline-explorer-title">A video-to-signal pipeline in explicit stages</h3>
      </header>
      <div className="pipeline-explorer__stages" aria-label="Pipeline stages">
        {stages.map((stage, index) => (
          <button
            aria-pressed={activeIndex === index}
            className="pipeline-stage"
            key={stage.name}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            {stage.name}
          </button>
        ))}
      </div>
      <div className="pipeline-explorer__detail" aria-live="polite">
        <span>{String(activeIndex + 1).padStart(2, "0")}</span>
        <div>
          <strong>{activeStage.name}</strong>
          <p>{activeStage.detail}</p>
        </div>
      </div>
    </section>
  );
}
