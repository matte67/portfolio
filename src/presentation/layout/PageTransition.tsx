import { useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";

import {
  createSphericalSignalPoints,
  type SignalPoint,
} from "../visuals/signalPattern";

const TRANSITION_POINT_COUNT = 1624;
const TRANSITION_VIEWBOX_SIZE = 100;

function drawTransitionSignal(canvas: HTMLCanvasElement, points: readonly SignalPoint[]) {
  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = TRANSITION_VIEWBOX_SIZE * devicePixelRatio;
  canvas.height = TRANSITION_VIEWBOX_SIZE * devicePixelRatio;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.scale(devicePixelRatio, devicePixelRatio);
  context.clearRect(0, 0, TRANSITION_VIEWBOX_SIZE, TRANSITION_VIEWBOX_SIZE);

  const accent = getComputedStyle(canvas).color;
  const ink = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-ink")
    .trim();

  for (const point of points) {
    context.fillStyle = point.accent ? accent : ink;
    context.beginPath();
    context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalAlpha = 1;
}

/** Lightweight fixed overlay for continuous route transitions. */
export function PageTransition() {
  const location = useLocation();
  const points = useMemo(
    () => createSphericalSignalPoints(TRANSITION_POINT_COUNT, {
      centerX: 50,
      centerY: 50,
      fieldRadius: 29,
      dotScale: 1,
    }),
    [],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) drawTransitionSignal(canvasRef.current, points);
  }, [points]);

  return (
    <div aria-hidden="true" className="page-transition" key={location.key}>
      <canvas
        aria-hidden="true"
        className="page-transition__signal"
        ref={canvasRef}
      />
    </div>
  );
}
