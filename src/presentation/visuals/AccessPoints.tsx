import { useState } from "react";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";

const samples = {
  API: "outputs = (\n  sef.pipeline()\n  .extract(\"opencv_buffered\")\n  .process(\"stabilize\")\n  .analyze(\"motion\")\n  .visualize(\"summary_text\")\n  .run()\n)",
  CLI: "$ sef validate pipeline.yaml\n✓ 6 stages resolved\n✓ streaming plan available\n\n$ sef run pipeline.yaml --outputs ./artifacts\n→ outputs written to ./artifacts",
  Studio: "SOURCE  tennis.mov\nRUNTIME realtime-low-latency\nSTAGES   extractor → processor → analyzer\nOUTPUT   signal.csv · preview.mp4",
} as const;

type AccessPoint = keyof typeof samples;

export function AccessPoints() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "editorial").accessPoints;
  const [active, setActive] = useState<AccessPoint>("API");
  const current = { description: copy.descriptions[active], sample: samples[active] };

  return (
    <section className="access-points" aria-labelledby="access-points-title">
      <div className="access-points__intro flex flex-col gap-4">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h3 id="access-points-title">{copy.title}</h3>
        <p>{current.description}</p>
        <div className="access-points__tabs" role="tablist" aria-label={copy.ariaLabel}>
          {(Object.keys(samples) as AccessPoint[]).map((item) => (
            <button
              aria-controls="access-point-panel"
              aria-selected={active === item}
              id={`access-tab-${item.toLowerCase()}`}
              key={item}
              onClick={() => setActive(item)}
              role="tab"
              tabIndex={active === item ? 0 : -1}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div
        aria-labelledby={`access-tab-${active.toLowerCase()}`}
        className="terminal-panel"
        id="access-point-panel"
        role="tabpanel"
      >
        <div className="terminal-panel__chrome">
          <span />
          <span />
          <span />
          <small>sef / {active.toLowerCase()}</small>
        </div>
        <pre><code>{current.sample}</code></pre>
      </div>
    </section>
  );
}
