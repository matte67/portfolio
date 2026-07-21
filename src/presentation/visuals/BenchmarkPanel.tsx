import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";

const memoryValues = [
  { labelKey: "directLoop", value: 154.7 },
  { labelKey: "batch", value: 132.6 },
  { labelKey: "streaming", value: 39.8 },
] as const;

export function BenchmarkPanel() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "editorial").benchmark;
  const maximum = Math.max(...memoryValues.map(({ value }) => value));

  return (
    <section className="benchmark-panel" aria-labelledby="benchmark-title">
      <header>
        <p className="eyebrow">{copy.eyebrow}</p>
        <h3 id="benchmark-title">{copy.title}</h3>
        <p>{copy.description}</p>
      </header>
      <div className="benchmark-panel__body">
        <div className="benchmark-bars" aria-label={copy.ariaLabel}>
          {memoryValues.map((item) => (
            <div className="benchmark-bar" key={item.labelKey}>
              <span className="benchmark-bar__value">{item.value} MiB</span>
              <div className="benchmark-bar__track">
                <span style={{ width: `${(item.value / maximum) * 100}%` }} />
              </div>
              <span className="benchmark-bar__label">
                {copy[item.labelKey]}
              </span>
            </div>
          ))}
        </div>
        <div className="benchmark-overhead">
          <span>{copy.streamingOverhead}</span>
          <strong>1.01×</strong>
          <small>{copy.directLoop} = 1.00×</small>
        </div>
      </div>
      <p className="figure-note">{copy.source}</p>
    </section>
  );
}
