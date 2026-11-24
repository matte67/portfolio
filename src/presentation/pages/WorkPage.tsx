import { useMemo } from "react";

import { projectCatalog } from "../../app/dependencies";
import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { getWorkJourney } from "../../application/workJourney";
import { DocumentMeta } from "../components/DocumentMeta";
import { WorkJourney } from "../work/WorkJourney";

/** Presents the portfolio along the stops of the Almost There film. */
export function WorkPage() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "work");
  const stops = useMemo(
    () => getWorkJourney(language, projectCatalog.listProjects(language).map(({ metadata }) => metadata)),
    [language],
  );

  return (
    <>
      <DocumentMeta {...copy.meta} />
      <WorkJourney
        heading={copy.meta.title}
        readLabel={copy.read}
        routeLabel={copy.route}
        startLabel={copy.start}
        stops={stops}
      />
    </>
  );
}
