import type { ReactNode } from "react";

interface ContentNeededProps {
  readonly title: string;
  readonly children: ReactNode;
}

/** Editorial placeholder that stays honest without presenting unfinished copy as evidence. */
export function ContentNeeded({ title, children }: ContentNeededProps) {
  return (
    <aside className="content-needed" aria-label={title}>
      <p className="content-needed__label">Content checkpoint</p>
      <h3>{title}</h3>
      <div>{children}</div>
    </aside>
  );
}
