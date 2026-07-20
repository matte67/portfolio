import { useEffect, useRef } from "react";

interface MagneticMotionOptions {
  readonly interactionSelector: string;
  readonly interpolationFactor: number;
  readonly maxHorizontalShift: number;
  readonly maxVerticalShift: number;
  readonly pointerInfluence: number;
  readonly rotationFactor?: number;
}

const SETTLE_THRESHOLD = 0.05;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Applies cursor-following motion without triggering React renders.
 * Fine-pointer and reduced-motion media queries keep the interaction optional.
 */
export function useMagneticMotion<TRoot extends HTMLElement, TLayer extends HTMLElement>({
  interactionSelector,
  interpolationFactor,
  maxHorizontalShift,
  maxVerticalShift,
  pointerInfluence,
  rotationFactor = 0,
}: MagneticMotionOptions) {
  const rootRef = useRef<TRoot>(null);
  const movingLayerRef = useRef<TLayer>(null);

  useEffect(() => {
    const root = rootRef.current;
    const movingLayer = movingLayerRef.current;
    const interactionRegion = root?.closest<HTMLElement>(interactionSelector) ?? root?.parentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");

    if (!root || !movingLayer || !interactionRegion || reducedMotion.matches || !finePointer.matches) {
      return;
    }

    let animationFrame: number | undefined;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const applyTransform = () => {
      movingLayer.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${currentX * rotationFactor}deg)`;
    };

    const renderPosition = () => {
      currentX += (targetX - currentX) * interpolationFactor;
      currentY += (targetY - currentY) * interpolationFactor;

      const hasSettled =
        Math.abs(targetX - currentX) < SETTLE_THRESHOLD &&
        Math.abs(targetY - currentY) < SETTLE_THRESHOLD;

      if (hasSettled) {
        currentX = targetX;
        currentY = targetY;
        applyTransform();
        animationFrame = undefined;
        return;
      }

      applyTransform();
      animationFrame = window.requestAnimationFrame(renderPosition);
    };

    const requestRender = () => {
      if (animationFrame === undefined) {
        animationFrame = window.requestAnimationFrame(renderPosition);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        return;
      }

      const bounds = root.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;

      targetX = clamp(
        (event.clientX - centerX) * pointerInfluence,
        -maxHorizontalShift,
        maxHorizontalShift,
      );
      targetY = clamp(
        (event.clientY - centerY) * pointerInfluence,
        -maxVerticalShift,
        maxVerticalShift,
      );
      requestRender();
    };

    const resetPosition = () => {
      targetX = 0;
      targetY = 0;
      requestRender();
    };

    interactionRegion.addEventListener("pointermove", handlePointerMove);
    interactionRegion.addEventListener("pointerleave", resetPosition);

    return () => {
      interactionRegion.removeEventListener("pointermove", handlePointerMove);
      interactionRegion.removeEventListener("pointerleave", resetPosition);
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [
    interactionSelector,
    interpolationFactor,
    maxHorizontalShift,
    maxVerticalShift,
    pointerInfluence,
    rotationFactor,
  ]);

  return { movingLayerRef, rootRef };
}
