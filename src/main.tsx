import "@fontsource-variable/instrument-sans/index.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "./app/router";
import { ClickSpark } from "./presentation/effects/ClickSpark";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Application root element was not found.");
}

// Static route content is emitted at build time for crawlers and no-JS clients.
// React owns the root once the interactive application starts.
rootElement.replaceChildren();

createRoot(rootElement).render(
  <StrictMode>
    <ClickSpark
      duration={400}
      sparkColor="#8f3522"
      sparkCount={8}
      sparkRadius={25}
      sparkSize={12}
    >
      <RouterProvider router={router} />
    </ClickSpark>
  </StrictMode>,
);
