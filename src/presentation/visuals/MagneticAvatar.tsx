import { useEffect, useRef } from "react";

import { useMagneticMotion } from "../hooks/useMagneticMotion";

/**
 * A restrained cursor-following portrait for the homepage hero.
 * Motion is intentionally handled outside React's render cycle and is disabled
 * for coarse pointers and visitors who prefer reduced motion.
 */
export function MagneticAvatar() {
  const revealFrameRef = useRef<number | undefined>(undefined);
  const revealTargetRef = useRef({ x: 50, y: 50 });
  const revealPositionRef = useRef({ x: 50, y: 50 });
  const { movingLayerRef, rootRef } = useMagneticMotion<HTMLDivElement, HTMLDivElement>({
    interactionSelector: ".home-hero",
    interpolationFactor: 0.14,
    maxHorizontalShift: 20,
    maxVerticalShift: 16,
    pointerInfluence: 0.07,
    rotationFactor: 0.045,
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const renderReveal = () => {
      const target = revealTargetRef.current;
      const position = revealPositionRef.current;
      position.x += (target.x - position.x) * 0.16;
      position.y += (target.y - position.y) * 0.16;
      root.style.setProperty("--avatar-reveal-x", `${position.x}%`);
      root.style.setProperty("--avatar-reveal-y", `${position.y}%`);

      if (Math.abs(target.x - position.x) > 0.1 || Math.abs(target.y - position.y) > 0.1) {
        revealFrameRef.current = window.requestAnimationFrame(renderReveal);
      } else {
        revealFrameRef.current = undefined;
      }
    };

    const scheduleReveal = () => {
      if (revealFrameRef.current === undefined) {
        revealFrameRef.current = window.requestAnimationFrame(renderReveal);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const bounds = root.getBoundingClientRect();
      revealTargetRef.current = {
        x: Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100)),
        y: Math.min(100, Math.max(0, ((event.clientY - bounds.top) / bounds.height) * 100)),
      };
      root.dataset.revealActive = "true";
      scheduleReveal();
    };

    const handlePointerLeave = () => {
      root.dataset.revealActive = "false";
    };

    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    root.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerleave", handlePointerLeave);
      if (revealFrameRef.current !== undefined) {
        window.cancelAnimationFrame(revealFrameRef.current);
      }
    };
  }, [rootRef]);

  return (
    <div
      className="magnetic-avatar"
      data-reveal-active="false"
      data-testid="magnetic-avatar"
      ref={rootRef}
    >
      <div
        className="magnetic-avatar__body"
        data-testid="magnetic-avatar-body"
        ref={movingLayerRef}
      >
        <picture>
          <source srcSet="/matteo-avatar.avif" type="image/avif" />
          <img
            alt="Illustrated portrait of Matteo Vittori"
            decoding="async"
            draggable="false"
            fetchPriority="high"
            height="1254"
            src="/matteo-avatar.avif"
            width="1254"
          />
        </picture>
        <div className="magnetic-avatar__pixel-reveal" aria-hidden="true">
          <img
            alt=""
            className="magnetic-avatar__pixel-effect ml-[1.7px] mb-1 rotate-[-0.7deg]"
            draggable="false"
            src="/matteo-avatar-pixel-effect-3.avif"
          />
        </div>
      </div>
    </div>
  );
}
