import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

import { TELEVISION_CHAPTER_CHANGE } from "./televisionEvents";
import type {
  createTelevisionRenderer,
  RasterDisturbance,
  ScreenPoint,
} from "./televisionRenderer";

const FRAME_INTERVAL_MS = 1000 / 30;
const CHAPTER_TRANSITION_MS = 320;
const RELEASE_DURATION_MS = 1_100;
const PRESS_BUILDUP_MS = 350;

interface ScreenPress {
  readonly origin: ScreenPoint;
  readonly pointerId: number;
  readonly startedAt: number;
  readonly pressure: number;
}

interface ScreenRelease {
  readonly origin: ScreenPoint;
  readonly startedAt: number;
  readonly strength: number;
}

function getPressAmount(press: ScreenPress, now: number) {
  const held = Math.min(1, (now - press.startedAt) / PRESS_BUILDUP_MS);
  return 0.35 + held * 0.25 + press.pressure * 0.4;
}

function getDisturbances(
  bounds: DOMRect,
  pointer: ScreenPoint | undefined,
  press: ScreenPress | undefined,
  release: ScreenRelease | undefined,
  now: number,
): RasterDisturbance[] {
  const disturbances: RasterDisturbance[] = [];
  const localize = ({ x, y }: ScreenPoint) => ({ x: x - bounds.left, y: y - bounds.top });

  if (pointer && !press && (!release || now - release.startedAt > PRESS_BUILDUP_MS)) {
    const drift = Math.sin(now / 116) * 0.08 + Math.sin(now / 57) * 0.04;
    disturbances.push({ ...localize(pointer), radius: 92, strength: 0.54 + drift });
  }

  if (press) {
    const amount = getPressAmount(press, now);
    disturbances.push({
      ...localize(press.origin),
      radius: 104 - amount * 24,
      strength: amount * 0.98,
    });
  }

  if (release) {
    const progress = Math.max(0, (now - release.startedAt) / RELEASE_DURATION_MS);
    if (progress < 1) {
      const origin = localize(release.origin);
      const crest = 24 + 156 * progress;
      disturbances.push({
        ...origin,
        radius: crest + 45,
        crest,
        strength: release.strength * (1 - progress) ** 2 * 1.4,
      });
      disturbances.push({
        ...origin,
        radius: 85,
        strength: release.strength * Math.max(0, 1 - progress * 5),
      });
    }
  }
  return disturbances;
}

function runTelevision(
  overlay: HTMLDivElement,
  canvas: HTMLCanvasElement,
  main: HTMLElement,
  renderer: ReturnType<typeof createTelevisionRenderer>,
  transitionStartedAt: () => number,
) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let pointer: ScreenPoint | undefined;
  let press: ScreenPress | undefined;
  let release: ScreenRelease | undefined;
  let frame = 0;
  let lastDraw = -Infinity;
  let onScreen = false;
  let contextLost = false;
  let boundsDirty = true;
  let bounds = canvas.getBoundingClientRect();
  let mainBounds = main.getBoundingClientRect();

  const updateBounds = () => {
    boundsDirty = false;
    bounds = canvas.getBoundingClientRect();
    mainBounds = main.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    renderer.resize(bounds.width, bounds.height, window.devicePixelRatio);
  };

  const isInsideScreen = ({ x, y }: ScreenPoint) =>
    x >= bounds.left && x <= bounds.right
    && y >= Math.max(bounds.top, mainBounds.top)
    && y <= Math.min(bounds.bottom, mainBounds.bottom);

  const draw = (now: number) => {
    frame = 0;
    if (document.hidden || !onScreen || contextLost) return;
    if (boundsDirty) updateBounds();

    if (bounds.width && bounds.height && now - lastDraw >= FRAME_INTERVAL_MS - 1) {
      if (release && now - release.startedAt >= RELEASE_DURATION_MS) release = undefined;
      const activePointer = pointer && isInsideScreen(pointer) ? pointer : undefined;
      const disturbances = reducedMotion.matches
        ? []
        : getDisturbances(bounds, activePointer, press, release, now);
      const animated = !reducedMotion.matches;
      const transition = Math.max(0, 1 - (now - transitionStartedAt()) / CHAPTER_TRANSITION_MS);
      const drawn = renderer.draw({
        seconds: animated ? now / 1000 : 0,
        animated,
        transition: animated ? transition : 0,
        disturbances,
      });
      if (!drawn) {
        overlay.dataset.renderer = "fallback";
        return;
      }
      if (overlay.dataset.renderer !== "webgl") overlay.dataset.renderer = "webgl";
      lastDraw = now;
    }

    if (!reducedMotion.matches) frame = requestAnimationFrame(draw);
  };

  const scheduleDraw = () => {
    if (!frame && onScreen && !document.hidden && !contextLost) frame = requestAnimationFrame(draw);
  };

  const invalidateBounds = () => {
    boundsDirty = true;
    if (reducedMotion.matches) lastDraw = -Infinity;
    scheduleDraw();
  };

  const trackPointer = (event: PointerEvent) => {
    if (!event.isPrimary || reducedMotion.matches) return;
    if (event.pointerType !== "touch") pointer = { x: event.clientX, y: event.clientY };
    if (press?.pointerId === event.pointerId) press = { ...press, pressure: event.pressure };
  };

  const startPress = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || reducedMotion.matches) return;
    if (boundsDirty) updateBounds();
    const origin = { x: event.clientX, y: event.clientY };
    if (!isInsideScreen(origin)) return;

    if (event.pointerType !== "touch") pointer = origin;
    press = { origin, pointerId: event.pointerId, startedAt: performance.now(), pressure: event.pressure };
    release = undefined;
  };

  const endPress = (event: PointerEvent) => {
    if (!press || press.pointerId !== event.pointerId) return;
    const now = performance.now();
    if (event.type === "pointerup") {
      release = { origin: press.origin, startedAt: now, strength: getPressAmount(press, now) };
    }
    press = undefined;
  };

  const leaveScreen = () => {
    pointer = undefined;
  };

  const resetInteraction = () => {
    leaveScreen();
    press = undefined;
    release = undefined;
  };

  const changeMotionPreference = () => {
    resetInteraction();
    invalidateBounds();
  };

  const showFallback = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    overlay.dataset.renderer = "fallback";
  };

  const restoreContext = () => {
    contextLost = false;
    lastDraw = -Infinity;
    invalidateBounds();
  };

  const intersection = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    scheduleDraw();
  });
  const resize = new ResizeObserver(invalidateBounds);
  intersection.observe(overlay);
  resize.observe(canvas);
  resize.observe(main);

  canvas.addEventListener("webglcontextlost", showFallback);
  canvas.addEventListener("webglcontextrestored", restoreContext);
  main.addEventListener("pointermove", trackPointer, { passive: true });
  main.addEventListener("pointerdown", startPress, { passive: true });
  main.addEventListener("pointerleave", leaveScreen);
  window.addEventListener("pointerup", endPress);
  window.addEventListener("pointercancel", endPress);
  window.addEventListener("blur", resetInteraction);
  window.addEventListener("scroll", invalidateBounds, { passive: true });
  window.addEventListener("resize", invalidateBounds, { passive: true });
  document.addEventListener("visibilitychange", scheduleDraw);
  reducedMotion.addEventListener("change", changeMotionPreference);

  return () => {
    intersection.disconnect();
    resize.disconnect();
    cancelAnimationFrame(frame);
    canvas.removeEventListener("webglcontextlost", showFallback);
    canvas.removeEventListener("webglcontextrestored", restoreContext);
    main.removeEventListener("pointermove", trackPointer);
    main.removeEventListener("pointerdown", startPress);
    main.removeEventListener("pointerleave", leaveScreen);
    window.removeEventListener("pointerup", endPress);
    window.removeEventListener("pointercancel", endPress);
    window.removeEventListener("blur", resetInteraction);
    window.removeEventListener("scroll", invalidateBounds);
    window.removeEventListener("resize", invalidateBounds);
    document.removeEventListener("visibilitychange", scheduleDraw);
    reducedMotion.removeEventListener("change", changeMotionPreference);
  };
}

/** Keeps the CRT glass above the page and under the physical frame. */
export function TelevisionOverlay() {
  const overlayRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { pathname } = useLocation();
  const previousChapter = useRef(pathname);
  const transitionStart = useRef(-Infinity);

  useEffect(() => {
    if (previousChapter.current === pathname) return;
    previousChapter.current = pathname;
    transitionStart.current = performance.now();
  }, [pathname]);

  useEffect(() => {
    const overlay = overlayRef.current;
    const canvas = canvasRef.current;
    const main = overlay?.parentElement;
    if (!overlay || !canvas || !main) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;
    const startTransition = () => { transitionStart.current = performance.now(); };
    main.addEventListener(TELEVISION_CHAPTER_CHANGE, startTransition);
    void import("./televisionRenderer").then(({ createTelevisionRenderer }) => {
      if (disposed) return;

      const renderer = createTelevisionRenderer(canvas);
      const stop = runTelevision(overlay, canvas, main, renderer, () => transitionStart.current);
      cleanup = () => {
        stop();
        renderer.dispose();
      };
    }).catch(() => {
      if (!disposed) overlay.dataset.renderer = "fallback";
    });

    return () => {
      disposed = true;
      main.removeEventListener(TELEVISION_CHAPTER_CHANGE, startTransition);
      cleanup?.();
    };
  }, []);

  return (
    <div aria-hidden="true" className="television-overlay" ref={overlayRef}>
      <div className="television-overlay__screen">
        <canvas className="television-overlay__canvas" ref={canvasRef} />
      </div>
    </div>
  );
}
