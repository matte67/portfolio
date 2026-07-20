const memoryValues = [
  { label: "Direct loop", value: 154.7 },
  { label: "SEF batch", value: 132.6 },
  { label: "SEF streaming", value: 39.8 },
] as const;

export function BenchmarkPanel() {
  const maximum = Math.max(...memoryValues.map(({ value }) => value));

  return (
    <section className="benchmark-panel" aria-labelledby="benchmark-title">
      <header>
        <p className="eyebrow">Reference benchmark</p>
        <h3 id="benchmark-title">Abstraction cost, measured</h3>
        <p>Streaming stayed close to the direct loop while using about a quarter of its peak memory.</p>
      </header>
      <div className="benchmark-panel__body">
        <div className="benchmark-bars" aria-label="Peak process memory in mebibytes">
          {memoryValues.map((item) => (
            <div className="benchmark-bar" key={item.label}>
              <span className="benchmark-bar__value">{item.value} MiB</span>
              <div className="benchmark-bar__track">
                <span style={{ width: `${(item.value / maximum) * 100}%` }} />
              </div>
              <span className="benchmark-bar__label">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="benchmark-overhead">
          <span>Streaming overhead</span>
          <strong>1.01×</strong>
          <small>Direct loop = 1.00×</small>
        </div>
      </div>
      <p className="figure-note">Source: SEF thesis presentation. Add raw benchmark data and environment details before publication.</p>
    </section>
  );
}
