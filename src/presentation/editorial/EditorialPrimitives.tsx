import type { ReactNode } from "react";

type EditorialCalloutTone = "accent" | "dark" | "quiet";

interface EditorialCalloutProps {
  readonly eyebrow?: string;
  readonly title: string;
  readonly children?: ReactNode;
  readonly body?: ReactNode;
  readonly tone?: EditorialCalloutTone;
}

/** A compact, reusable way to surface a principle, decision, or caveat. */
export function EditorialCallout({
  children,
  body,
  eyebrow,
  title,
  tone = "quiet",
}: EditorialCalloutProps) {
  return (
    <aside className={`editorial-callout max-w-[50rem] editorial-callout--${tone}`}>
      {eyebrow ? <p className="editorial-callout__eyebrow">{eyebrow}</p> : null}
      <h3>{title}</h3>
      <div className="editorial-callout__body">{children ?? body}</div>
    </aside>
  );
}

export interface EditorialFlowItem {
  readonly number?: string;
  readonly title: string;
  readonly description: string;
}

interface EditorialFlowProps {
  readonly items: readonly EditorialFlowItem[];
  readonly label?: string;
}

/** Presents a bounded process as a visual sequence rather than a plain list. */
export function EditorialFlow({ items, label = "Editorial process" }: EditorialFlowProps) {
  return (
    <ol className="editorial-flow" aria-label={label}>
      {items.map((item, index) => (
        <li key={`${item.title}-${index}`}>
          <span>{item.number ?? String(index + 1).padStart(2, "0")}</span>
          <strong>{item.title}</strong>
          <p>{item.description}</p>
        </li>
      ))}
    </ol>
  );
}

interface EditorialQuoteProps {
  readonly children?: ReactNode;
  readonly quote?: string;
  readonly cite?: string;
}

/** Quote treatment used by both MDX collections. */
export function EditorialQuote({ children, cite, quote }: EditorialQuoteProps) {
  return (
    <figure className="editorial-quote">
      <blockquote>{children ?? quote}</blockquote>
      {cite ? <figcaption>— {cite}</figcaption> : null}
    </figure>
  );
}
