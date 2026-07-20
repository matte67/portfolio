import { gsap } from "gsap/gsap-core";
import { useEffect, useMemo, useRef } from "react";

import { useMagneticMotion } from "../hooks/useMagneticMotion";
import {
  createSignalPoints,
  createSphericalSignalPoints,
  SIGNAL_VIEWBOX_HEIGHT,
  SIGNAL_VIEWBOX_WIDTH,
  type SignalPoint,
} from "./signalPattern";

const POINT_COUNT = 8440;
const FORMATION_POINT_COUNT = 8440;
const FORMATION_DURATION_MS = 6200;
const FORMATION_DPR_LIMIT = 1.7;
const FORMATION_CENTER_X = SIGNAL_VIEWBOX_WIDTH / 2;
const FORMATION_CENTER_Y = SIGNAL_VIEWBOX_HEIGHT / 2;
const FORMATION_SPHERE_RADIUS = 131;
const FORMATION_DOT_SCALE = 3.6;
const FORMATION_EXPAND_END = 0.16;
const FORMATION_COLLAPSE_END = 0.36;
const FORMATION_EXPLOSION_END = 0.56;
const FORMATION_CROSSFADE_START = 0.64;
const FORMATION_OPACITY_BUCKETS = [0.6, 0.64, 0.7, 0.88] as const;
const PROXIMITY_RADIUS = 0;
const SPEED_TRIGGER = 1.2;
const SHOCK_RADIUS = 128;
const SHOCK_STRENGTH = 1.2;
const RETURN_DURATION = 1.35;
const MAX_POINTER_SPEED = 1_100;
const SPATIAL_CELL_SIZE = Math.max(PROXIMITY_RADIUS, SHOCK_RADIUS, 1);

type FieldPoint = SignalPoint;

export interface SignalFieldProps {
  /** Enables the one-shot sphere-to-field formation used by the homepage hero. */
  readonly animateEntrance?: boolean;
}

interface FormationParticle {
  readonly source: SignalPoint;
  readonly target: SignalPoint;
  readonly explosionX: number;
  readonly explosionY: number;
  readonly curveOffset: number;
}

interface AnimatedFieldPoint extends FieldPoint {
  inertiaX: number;
  inertiaY: number;
  isAnimating: boolean;
}

interface PointerState {
  x: number;
  y: number;
  speed: number;
  lastTime: number;
  lastX: number;
  lastY: number;
  isInside: boolean;
}

type SpatialIndex = ReadonlyMap<string, readonly number[]>;

function lerp(start: number, end: number, progress: number) {
  return start + (end - start) * progress;
}

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function easeOutQuint(progress: number) {
  return 1 - Math.pow(1 - progress, 5);
}

function deterministicUnit(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createFormationParticles(count: number): readonly FormationParticle[] {
  const sourcePoints = createSphericalSignalPoints(count, {
    centerX: FORMATION_CENTER_X,
    centerY: FORMATION_CENTER_Y,
    fieldRadius: FORMATION_SPHERE_RADIUS,
    dotScale: FORMATION_DOT_SCALE,
  });
  const targetPoints = createSignalPoints(count);

  return sourcePoints.map((source, index) => {
    const radialAngle = Math.atan2(
      source.y - FORMATION_CENTER_Y,
      source.x - FORMATION_CENTER_X,
    );
    const direction = radialAngle + (deterministicUnit(index, 1) - 0.5) * 0.9;
    const distance = 48 + deterministicUnit(index, 2) * 112;

    return {
      source,
      target: targetPoints[index],
      explosionX: Math.cos(direction) * distance,
      explosionY: Math.sin(direction) * distance,
      curveOffset: (deterministicUnit(index, 3) - 0.5) * 42,
    };
  });
}

function transformSpherePoint(point: SignalPoint, scale: number, rotation: number) {
  const angle = rotation * (Math.PI / 180);
  const relativeX = point.x - FORMATION_CENTER_X;
  const relativeY = point.y - FORMATION_CENTER_Y;

  return {
    x: FORMATION_CENTER_X + (relativeX * Math.cos(angle) - relativeY * Math.sin(angle)) * scale,
    y: FORMATION_CENTER_Y + (relativeX * Math.sin(angle) + relativeY * Math.cos(angle)) * scale,
  };
}

function opacityBucketIndex(opacity: number) {
  if (opacity < 0.27) return 0;
  if (opacity < 0.42) return 1;
  if (opacity < 0.58) return 2;
  return 3;
}

function drawFormationFrame(
  context: CanvasRenderingContext2D,
  particles: readonly FormationParticle[],
  progress: number,
  accentColor: string,
  inkColor: string,
) {
  context.clearRect(0, 0, SIGNAL_VIEWBOX_WIDTH, SIGNAL_VIEWBOX_HEIGHT);
  const paths = Array.from({ length: FORMATION_OPACITY_BUCKETS.length * 2 }, () => new Path2D());

  for (const particle of particles) {
    let x: number;
    let y: number;
    let radius: number;
    let opacity: number;

    if (progress <= FORMATION_EXPAND_END) {
      const stage = easeInOutCubic(progress / FORMATION_EXPAND_END);
      const transformed = transformSpherePoint(
        particle.source,
        lerp(0.88, 1.42, stage),
        lerp(0, 180, stage),
      );
      x = transformed.x;
      y = transformed.y;
      radius = particle.source.radius * lerp(0.92, 1.06, stage);
      opacity = particle.source.opacity * lerp(0.9, 0.78, stage);
    } else if (progress <= FORMATION_COLLAPSE_END) {
      const stage = easeInOutCubic(
        (progress - FORMATION_EXPAND_END) /
        (FORMATION_COLLAPSE_END - FORMATION_EXPAND_END),
      );
      const transformed = transformSpherePoint(
        particle.source,
        lerp(1.42, 0.1, stage),
        lerp(180, 450, stage),
      );
      x = transformed.x;
      y = transformed.y;
      radius = particle.source.radius * lerp(1.06, 0.68, stage);
      opacity = particle.source.opacity * lerp(0.78, 0.58, stage);
    } else if (progress <= FORMATION_EXPLOSION_END) {
      const stage = easeOutCubic(
        (progress - FORMATION_COLLAPSE_END) /
        (FORMATION_EXPLOSION_END - FORMATION_COLLAPSE_END),
      );
      const collapsed = transformSpherePoint(particle.source, 0.1, 450);
      x = collapsed.x + particle.explosionX * stage;
      y = collapsed.y + particle.explosionY * stage;
      radius = particle.source.radius * lerp(0.68, 1.12, stage);
      opacity = particle.source.opacity * lerp(0.58, 1.05, stage);
    } else {
      const stage = easeOutQuint(
        (progress - FORMATION_EXPLOSION_END) /
        (1 - FORMATION_EXPLOSION_END),
      );
      const collapsed = transformSpherePoint(particle.source, 0.1, 450);
      const startX = collapsed.x + particle.explosionX;
      const startY = collapsed.y + particle.explosionY;
      const deltaX = particle.target.x - startX;
      const deltaY = particle.target.y - startY;
      const distance = Math.max(1, Math.hypot(deltaX, deltaY));
      const curve = Math.sin(stage * Math.PI) * particle.curveOffset;

      x = lerp(startX, particle.target.x, stage) - (deltaY / distance) * curve;
      y = lerp(startY, particle.target.y, stage) + (deltaX / distance) * curve;
      radius = lerp(particle.source.radius * 1.12, particle.target.radius, stage);
      opacity = lerp(Math.max(0.36, particle.source.opacity), particle.target.opacity, stage);
    }

    const colorOffset = particle.source.accent ? FORMATION_OPACITY_BUCKETS.length : 0;
    const path = paths[colorOffset + opacityBucketIndex(opacity)];
    path.moveTo(x + radius, y);
    path.arc(x, y, radius, 0, Math.PI * 2);
  }

  for (let index = 0; index < paths.length; index += 1) {
    const opacityIndex = index % FORMATION_OPACITY_BUCKETS.length;
    context.globalAlpha = FORMATION_OPACITY_BUCKETS[opacityIndex];
    context.fillStyle = index < FORMATION_OPACITY_BUCKETS.length ? inkColor : accentColor;
    context.fill(paths[index]);
  }
  context.globalAlpha = 1;
}

function toAnimatedPoint(point: FieldPoint): AnimatedFieldPoint {
  return { ...point, inertiaX: 0, inertiaY: 0, isAnimating: false };
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function cellKey(x: number, y: number): string {
  return `${Math.floor(x / SPATIAL_CELL_SIZE)}:${Math.floor(y / SPATIAL_CELL_SIZE)}`;
}

/** Indexes the static point distribution once, avoiding full-field scans during interactions. */
function createSpatialIndex(points: readonly FieldPoint[]): SpatialIndex {
  const index = new Map<string, number[]>();

  points.forEach((point, pointIndex) => {
    const key = cellKey(point.x, point.y);
    const cell = index.get(key);
    if (cell) cell.push(pointIndex);
    else index.set(key, [pointIndex]);
  });

  return index;
}

function findCandidatePointIndexes(index: SpatialIndex, x: number, y: number, radius: number): readonly number[] {
  if (radius <= 0) return [];

  const minimumX = Math.floor((x - radius) / SPATIAL_CELL_SIZE);
  const maximumX = Math.floor((x + radius) / SPATIAL_CELL_SIZE);
  const minimumY = Math.floor((y - radius) / SPATIAL_CELL_SIZE);
  const maximumY = Math.floor((y + radius) / SPATIAL_CELL_SIZE);
  const candidates: number[] = [];

  for (let column = minimumX; column <= maximumX; column += 1) {
    for (let row = minimumY; row <= maximumY; row += 1) {
      candidates.push(...(index.get(`${column}:${row}`) ?? []));
    }
  }

  return candidates;
}

/**
 * Renders the sampled signal geometry and gives individual points a local physical response.
 * Hover proximity applies a subtle repulsion; fast cursor movement and clicks create a temporary
 * inertial displacement that springs back without changing the underlying point distribution.
 */
export function SignalField({ animateEntrance = false }: SignalFieldProps) {
  const points = useMemo(() => createSignalPoints(POINT_COUNT), []);
  const formationParticles = useMemo(
    () => animateEntrance ? createFormationParticles(FORMATION_POINT_COUNT) : [],
    [animateEntrance],
  );
  const spatialIndex = useMemo(() => createSpatialIndex(points), [points]);
  const formationCanvasRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const meshRef = useRef<SVGGElement>(null);
  const pointElementsRef = useRef<(SVGCircleElement | null)[]>([]);
  const animatedPointsRef = useRef<AnimatedFieldPoint[]>(points.map(toAnimatedPoint));
  const pointerRef = useRef<PointerState>({
    x: 0,
    y: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
    isInside: false,
  });
  const { movingLayerRef, rootRef } = useMagneticMotion<HTMLDivElement, HTMLDivElement>({
    interactionSelector: " .about-hero, .not-found",
    interpolationFactor: 0.1,
    maxHorizontalShift: 9,
    maxVerticalShift: 6,
    pointerInfluence: 0.01,
    rotationFactor: 0.172,
  });

  useEffect(() => {
    if (!animateEntrance) return;

    const root = rootRef.current;
    const canvas = formationCanvasRef.current;
    const svg = svgRef.current;
    if (!root || !canvas || !svg) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) {
      root.dataset.formationState = "complete";
      canvas.style.display = "none";
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      root.dataset.formationState = "complete";
      return;
    }

    const devicePixelRatio = Math.min(window.devicePixelRatio || 1, FORMATION_DPR_LIMIT);
    canvas.width = SIGNAL_VIEWBOX_WIDTH * devicePixelRatio;
    canvas.height = SIGNAL_VIEWBOX_HEIGHT * devicePixelRatio;
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

    const accentColor = getComputedStyle(root).color;
    const inkColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-ink")
      .trim();
    let animationFrame: number | undefined;
    let startTime: number | undefined;

    root.dataset.formationState = "running";
    canvas.style.display = "block";
    canvas.style.opacity = "1";
    svg.style.opacity = "0";

    const finishFormation = () => {
      root.dataset.formationState = "complete";
      canvas.style.display = "none";
      canvas.style.removeProperty("opacity");
      svg.style.removeProperty("opacity");
      animationFrame = undefined;
    };

    const renderFormation = (time: number) => {
      startTime ??= time;
      const progress = clamp((time - startTime) / FORMATION_DURATION_MS, 0, 1);
      drawFormationFrame(context, formationParticles, progress, accentColor, inkColor);

      const crossfade = clamp(
        (progress - FORMATION_CROSSFADE_START) / (1 - FORMATION_CROSSFADE_START),
        0,
        1,
      );
      svg.style.opacity = String(crossfade);
      canvas.style.opacity = String(1 - crossfade);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(renderFormation);
      } else {
        finishFormation();
      }
    };

    animationFrame = window.requestAnimationFrame(renderFormation);

    return () => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      root.dataset.formationState = "pending";
      canvas.style.removeProperty("display");
      canvas.style.removeProperty("opacity");
      svg.style.removeProperty("opacity");
    };
  }, [animateEntrance, formationParticles, rootRef]);

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    const mesh = meshRef.current;
    const interactionRegion = root?.closest<HTMLElement>(".home-hero, .about-hero, .not-found") ?? root?.parentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(pointer: fine)");
    const animatedPoints = animatedPointsRef.current;

    if (!root || !svg || !mesh || !interactionRegion || reducedMotion.matches || !finePointer.matches) return;

    let frameId: number | undefined;
    const activeProximityIndexes = new Set<number>();
    const pendingRenderIndexes = new Set<number>();

    const pointAt = (event: PointerEvent) => {
      // The mesh itself rotates, so an axis-aligned bounding box produces incorrect proximity.
      // Its screen matrix includes the mesh drift and the magnetic layer rotation.
      const matrix = mesh.getScreenCTM();
      if (!matrix) return null;

      return new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    };

    const applyPointTransform = (point: AnimatedFieldPoint, index: number) => {
      const element = pointElementsRef.current[index];
      if (!element) return;

      const pointer = pointerRef.current;
      const distanceX = point.x - pointer.x;
      const distanceY = point.y - pointer.y;
      const distance = Math.hypot(distanceX, distanceY);
      const proximity = pointer.isInside && PROXIMITY_RADIUS > 0
        ? clamp(1 - distance / PROXIMITY_RADIUS, 0, 1)
        : 0;
      const directionX = distance === 0 ? 0 : distanceX / distance;
      const directionY = distance === 0 ? 0 : distanceY / distance;
      const hoverDistance = proximity * proximity * 4.5;
      const offsetX = point.inertiaX + directionX * hoverDistance;
      const offsetY = point.inertiaY + directionY * hoverDistance;
      const scale = 1 + proximity * 0.52;

      element.setAttribute("transform", `translate(${offsetX} ${offsetY}) scale(${scale})`);
      element.setAttribute("opacity", String(Math.min(0.92, point.opacity + proximity * 0.32)));
    };

    const renderProximity = () => {
      frameId = undefined;
      pendingRenderIndexes.forEach((index) => applyPointTransform(animatedPoints[index], index));
      pendingRenderIndexes.clear();
    };

    const requestProximityRender = (indexes: Iterable<number>) => {
      for (const index of indexes) pendingRenderIndexes.add(index);
      if (pendingRenderIndexes.size === 0) return;
      frameId ??= window.requestAnimationFrame(renderProximity);
    };

    const findPointsWithinRadius = (x: number, y: number, radius: number) => (
      findCandidatePointIndexes(spatialIndex, x, y, radius).filter((index) => {
        const point = animatedPoints[index];
        return Math.hypot(point.x - x, point.y - y) < radius;
      })
    );

    const updateProximityPoints = (x: number, y: number) => {
      const nextActiveIndexes = new Set(findPointsWithinRadius(x, y, PROXIMITY_RADIUS));
      const affectedIndexes = new Set([...activeProximityIndexes, ...nextActiveIndexes]);

      activeProximityIndexes.clear();
      nextActiveIndexes.forEach((index) => activeProximityIndexes.add(index));
      requestProximityRender(affectedIndexes);
    };

    const returnToOrigin = (point: AnimatedFieldPoint, index: number) => {
      gsap.to(point, {
        inertiaX: 0,
        inertiaY: 0,
        duration: RETURN_DURATION,
        ease: "elastic.out(1, 0.72)",
        onUpdate: () => applyPointTransform(point, index),
        onComplete: () => {
          point.isAnimating = false;
          applyPointTransform(point, index);
        },
      });
    };

    const displacePoint = (point: AnimatedFieldPoint, index: number, pushX: number, pushY: number) => {
      point.isAnimating = true;
      gsap.killTweensOf(point);
      gsap.to(point, {
        inertiaX: point.inertiaX + pushX,
        inertiaY: point.inertiaY + pushY,
        duration: 0.28,
        ease: "power3.out",
        onUpdate: () => applyPointTransform(point, index),
        onComplete: () => returnToOrigin(point, index),
      });
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const now = performance.now();
      const pointer = pointerRef.current;
      const position = pointAt(event);
      if (!position) return;
      const elapsed = pointer.lastTime ? Math.max(now - pointer.lastTime, 16) : 16;
      const velocityX = ((position.x - pointer.lastX) / elapsed) * 1_000;
      const velocityY = ((position.y - pointer.lastY) / elapsed) * 1_000;

      pointer.x = position.x;
      pointer.y = position.y;
      pointer.speed = Math.min(MAX_POINTER_SPEED, Math.hypot(velocityX, velocityY));
      pointer.lastTime = now;
      pointer.lastX = position.x;
      pointer.lastY = position.y;
      pointer.isInside = true;
      updateProximityPoints(position.x, position.y);

      if (pointer.speed <= SPEED_TRIGGER) return;

      findPointsWithinRadius(position.x, position.y, PROXIMITY_RADIUS).forEach((index) => {
        const point = animatedPoints[index];
        const distanceX = point.x - position.x;
        const distanceY = point.y - position.y;
        const distance = Math.hypot(distanceX, distanceY);
        if (distance >= PROXIMITY_RADIUS || point.isAnimating) return;

        const falloff = 1 - distance / PROXIMITY_RADIUS;
        const velocityInfluence = Math.min(pointer.speed / MAX_POINTER_SPEED, 1) * 6;
        displacePoint(
          point,
          index,
          distanceX * falloff * 0.14 + velocityX * velocityInfluence * 0.002,
          distanceY * falloff * 0.14 + velocityY * velocityInfluence * 0.002,
        );
      });
    };

    const handlePointerLeave = () => {
      pointerRef.current.isInside = false;
      requestProximityRender(activeProximityIndexes);
      activeProximityIndexes.clear();
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      if (root.dataset.formationState === "running") return;

      const position = pointAt(event);
      if (!position) return;
      findPointsWithinRadius(position.x, position.y, SHOCK_RADIUS).forEach((index) => {
        const point = animatedPoints[index];
        const distanceX = point.x - position.x;
        const distanceY = point.y - position.y;
        const distance = Math.hypot(distanceX, distanceY);
        if (distance >= SHOCK_RADIUS || point.isAnimating) return;

        const falloff = 1 - distance / SHOCK_RADIUS;
        displacePoint(
          point,
          index,
          distanceX * SHOCK_STRENGTH * falloff,
          distanceY * SHOCK_STRENGTH * falloff,
        );
      });
    };

    if (PROXIMITY_RADIUS > 0) {
      interactionRegion.addEventListener("pointermove", handlePointerMove, { passive: true });
      interactionRegion.addEventListener("pointerleave", handlePointerLeave);
    }
    interactionRegion.addEventListener("pointerdown", handlePointerDown, { passive: true });

    return () => {
      interactionRegion.removeEventListener("pointermove", handlePointerMove);
      interactionRegion.removeEventListener("pointerleave", handlePointerLeave);
      interactionRegion.removeEventListener("pointerdown", handlePointerDown);
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      animatedPoints.forEach((point) => gsap.killTweensOf(point));
    };
  }, [rootRef, spatialIndex]);

  return (
    <div
      className="signal-field"
      aria-hidden="true"
      data-formation-state={animateEntrance ? "pending" : undefined}
      ref={rootRef}
    >
      <div className="signal-field__magnetic" data-testid="magnetic-signal-field" ref={movingLayerRef}>
        {animateEntrance && (
          <canvas
            aria-hidden="true"
            className="signal-field__formation"
            ref={formationCanvasRef}
          />
        )}
        <svg ref={svgRef} viewBox={`0 0 ${SIGNAL_VIEWBOX_WIDTH} ${SIGNAL_VIEWBOX_HEIGHT}`} role="presentation">
          <g className="signal-field__mesh" ref={meshRef}>
            {points.map((point, index) => (
              <circle
                cx={point.x}
                cy={point.y}
                fill={point.accent ? "currentColor" : "var(--color-ink)"}
                key={index}
                opacity={point.opacity}
                r={point.radius}
                ref={(element) => { pointElementsRef.current[index] = element; }}
              />
            ))}
          </g>
          <path
            className="signal-field__orbit"
            d="M86 246c48-139 190-207 314-119 84 60 63 201-33 260-116 71-279-3-281-141Z"
            pathLength="1"
          />
        </svg>
      </div>
    </div>
  );
}
