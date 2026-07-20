import type { CSSProperties } from "react";

export type FrameCornerEdge = "top" | "bottom";
export type FrameCornerSide = "left" | "right";
export type FrameCornerPosition = "fixed" | "absolute";

export interface FrameCornerProps {
  readonly anchor?: FrameCornerSide;
  readonly edge: FrameCornerEdge;
  readonly position?: FrameCornerPosition;
  /** Additional clockwise rotation, expressed in degrees. */
  readonly rotation?: number;
  /** Curve intensity from 0 (diagonal) to 1 (fully rounded). */
  readonly roundness?: number;
  readonly side: FrameCornerSide;
  /** Optional per-corner size, expressed as any valid CSS length. */
  readonly size?: string;
}

/** Reusable dark raccord for any corner of the fixed page frame. */
export function FrameCorner({
  side,
  anchor = side,
  edge,
  position = "fixed",
  rotation = 0,
  roundness = 1,
  size,
}: FrameCornerProps) {
  const normalizedRoundness = Math.min(1, Math.max(0, roundness));
  const firstControlX = 42.67 + (28.65 - 42.67) * normalizedRoundness;
  const firstControlY = 42.67 + (64 - 42.67) * normalizedRoundness;
  const secondControlX = 21.33 * (1 - normalizedRoundness);
  const secondControlY = 21.33 + (35.35 - 21.33) * normalizedRoundness;
  const path = [
    "M0 0v64h64C",
    firstControlX.toFixed(2),
    firstControlY.toFixed(2),
    secondControlX.toFixed(2),
    secondControlY.toFixed(2),
    "0 0Z",
  ].join(" ");
  const style = {
    ...(size ? { height: size, width: size } : {}),
    "--frame-corner-rotation": `${rotation}deg`,
  } as CSSProperties;

  return (
    <svg
      aria-hidden="true"
      className={[
        "site-frame__corner",
        `site-frame__corner--${edge}`,
        `site-frame__corner--side-${side}`,
        `site-frame__corner--anchor-${anchor}`,
        `site-frame__corner--position-${position}`,
      ].join(" ")}
      focusable="false"
      style={style}
      viewBox="0 0 64 64"
    >
      <path d={path} fill="currentColor" />
    </svg>
  );
}
