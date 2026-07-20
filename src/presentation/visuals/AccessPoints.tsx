import { useState } from "react";

const accessPoints = {
  API: {
    description: "Compose and extend pipelines directly in Python.",
    sample: "outputs = (\n  sef.pipeline()\n  .extract(\"opencv_buffered\")\n  .process(\"stabilize\")\n  .analyze(\"motion\")\n  .visualize(\"summary_text\")\n  .run()\n)",
  },
  CLI: {
    description: "Validate and execute a reproducible configuration from the terminal.",
    sample: "$ sef validate pipeline.yaml\n✓ 6 stages resolved\n✓ streaming plan available\n\n$ sef run pipeline.yaml --outputs ./artifacts\n→ outputs written to ./artifacts",
  },
  Studio: {
    description: "Configure, inspect, and preview the same core through a visual interface.",
    sample: "SOURCE  tennis.mov\nRUNTIME realtime-low-latency\nSTAGES   extractor → processor → analyzer\nOUTPUT   signal.csv · preview.mp4",
  },
} as const;

type AccessPoint = keyof typeof accessPoints;

export function AccessPoints() {
  const [active, setActive] = useState<AccessPoint>("API");
  const current = accessPoints[active];

  return (
    <section className="access-points" aria-labelledby="access-points-title">
      <div className="access-points__intro flex flex-col gap-4">
        <p className="eyebrow">One core</p>
        <h3 id="access-points-title">Choose the interface, keep the model</h3>
        <p>{current.description}</p>
        <div className="access-points__tabs" role="tablist" aria-label="SEF access points">
          {(Object.keys(accessPoints) as AccessPoint[]).map((item) => (
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
