import { useState } from "react";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";

export function PipelineExplorer() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "editorial").pipeline;
  const stages = copy.stages.map(([name, detail]) => ({ name, detail }));
  const [activeIndex, setActiveIndex] = useState(0);
  const activeStage = stages[activeIndex];

  return (
    <section className="pipeline-explorer" aria-labelledby="pipeline-explorer-title">
      <header className="pipeline-explorer__header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h3 id="pipeline-explorer-title">{copy.title}</h3>
      </header>
      <div className="pipeline-explorer__stages" aria-label={copy.ariaLabel}>
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
