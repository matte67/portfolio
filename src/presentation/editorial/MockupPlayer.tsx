import { createElement, useEffect } from "react";

const MOCKUP_PLAYER_SCRIPT = "https://embed.mckp.live/embed.js";
const MCKP_ATTRIBUTION_STYLE = `
  a[href="https://mckp.live"],
  a[href^="https://mckp.live/"] {
    display: none !important;
  }
`;

type ElementPrototypeWithMckpPatch = typeof Element.prototype & {
  __portfolioMckpAttributionHider?: boolean;
};

function addMckpAttributionStyle(shadowRoot: ShadowRoot) {
  // MCKP may replace the shadow tree's light DOM during initialization. An
  // adopted sheet survives that replacement, unlike an appended <style> node.
  if ("adoptedStyleSheets" in shadowRoot && "replaceSync" in CSSStyleSheet.prototype) {
    const styleSheet = new CSSStyleSheet();
    styleSheet.replaceSync(MCKP_ATTRIBUTION_STYLE);
    shadowRoot.adoptedStyleSheets = [
      ...shadowRoot.adoptedStyleSheets,
      styleSheet,
    ];
    return;
  }

  const style = document.createElement("style");
  style.textContent = MCKP_ATTRIBUTION_STYLE;
  shadowRoot.append(style);
}

/**
 * MCKP creates a closed Shadow DOM, so page-level CSS cannot reach its
 * attribution link. Install a narrowly scoped hook before the third-party
 * script runs and add the rule directly to the player's shadow tree.
 *
 * The hook is intentionally kept installed: route navigation can mount a new
 * player after the script has already been loaded, and those players need the
 * same behavior without reloading the page.
 */
function installMckpAttributionHider() {
  const elementPrototype = Element.prototype as ElementPrototypeWithMckpPatch;
  if (elementPrototype.__portfolioMckpAttributionHider) return;

  const originalAttachShadow = Element.prototype.attachShadow;
  const patchedAttachShadow: typeof Element.prototype.attachShadow = function (
    this: Element,
    init,
  ) {
    const shadowRoot = originalAttachShadow.call(this, init);

    if (this.localName === "mockup-player") {
      addMckpAttributionStyle(shadowRoot);
    }

    return shadowRoot;
  };

  Element.prototype.attachShadow = patchedAttachShadow;
  elementPrototype.__portfolioMckpAttributionHider = true;
}

export interface MockupPlayerProps {
  readonly aspectRatio?: string;
  readonly cameraZoom?: number;
  readonly cursorRange?: string;
  readonly mockupId: string;
  readonly shakeAngle?: number;
  readonly shakeDuration?: number;
  readonly shakeIntensity?: number;
  readonly shakeZ?: number;
  readonly trigger?: string;
  readonly triggerLoop?: boolean;
  readonly className?: string;
}

/**
 * Loads the MCKP custom element once and keeps its third-party markup out of MDX.
 * The player remains a normal editorial block when the external script is delayed.
 */
export function MockupPlayer({
  aspectRatio = "16 / 9",
  cameraZoom = 21,
  cursorRange = "5-7-5-15",
  mockupId,
  shakeAngle,
  shakeDuration,
  shakeIntensity,
  shakeZ,
  trigger = "load",
  triggerLoop = true,
  className = "",
}: MockupPlayerProps) {
  useEffect(() => {
    installMckpAttributionHider();

    const scriptAlreadyLoaded = Array.from(document.scripts).some(
      (script) => script.src === MOCKUP_PLAYER_SCRIPT,
    );

    if (scriptAlreadyLoaded) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = MOCKUP_PLAYER_SCRIPT;
    document.head.appendChild(script);
  }, []);

  return (
    <div className={"mockup-player-embed " + className} data-mockup-id={mockupId}>
      {createElement("mockup-player", {
        "aspect-ratio": aspectRatio,
        "camera-zoom": cameraZoom,
        "cursor-range": cursorRange,
        "mockup-id": mockupId,
        "shake-angle": shakeAngle,
        "shake-duration": shakeDuration,
        "shake-intensity": shakeIntensity,
        "shake-z": shakeZ,
        trigger,
        "trigger-loop": String(triggerLoop),
      })}
    </div>
  );
}
