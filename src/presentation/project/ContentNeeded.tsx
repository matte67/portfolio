import type { ReactNode } from "react";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";

interface ContentNeededProps {
  readonly title: string;
  readonly children: ReactNode;
}

/** Editorial placeholder that stays honest without presenting unfinished copy as evidence. */
export function ContentNeeded({ title, children }: ContentNeededProps) {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "editorial");

  return (
    <aside className="content-needed" aria-label={title}>
      <p className="content-needed__label">{copy.contentNeededLabel}</p>
      <h3>{title}</h3>
      <div>{children}</div>
    </aside>
  );
}
