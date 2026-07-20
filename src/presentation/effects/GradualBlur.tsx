import {
  memo,
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./GradualBlur.css";

type BlurPosition = "top" | "bottom" | "left" | "right";
type BlurCurve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";

interface GradualBlurProps {
  readonly active?: boolean;
  readonly animated?: boolean | "scroll";
  readonly className?: string;
  readonly curve?: BlurCurve;
  readonly divCount?: number;
  readonly duration?: string;
  readonly easing?: string;
  readonly exponential?: boolean;
  readonly height?: string;
  readonly hoverIntensity?: number;
  readonly onAnimationComplete?: () => void;
  readonly opacity?: number;
  readonly position?: BlurPosition;
  readonly progress?: number;
  readonly strength?: number;
  readonly style?: CSSProperties;
  readonly target?: "parent" | "page";
  readonly width?: string;
  readonly zIndex?: number;
}

const curveFunctions: Record<BlurCurve, (progress: number) => number> = {
  linear: (progress) => progress,
  bezier: (progress) => progress * progress * (3 - 2 * progress),
  "ease-in": (progress) => progress * progress,
  "ease-out": (progress) => 1 - (1 - progress) ** 2,
  "ease-in-out": (progress) => (
    progress < 0.5
      ? 2 * progress * progress
      : 1 - ((-2 * progress + 2) ** 2) / 2
  ),
};

const gradientDirections: Record<BlurPosition, string> = {
  top: "to top",
  bottom: "to bottom",
  left: "to left",
  right: "to right",
};

/** A layered backdrop blur adapted from React Bits for fixed page edges. */
function GradualBlurComponent({
  active = true,
  animated = false,
  className = "",
  curve = "linear",
  divCount = 5,
  duration = "0.3s",
  easing = "ease-out",
  exponential = false,
  height = "6rem",
  hoverIntensity,
  onAnimationComplete,
  opacity = 1,
  position = "bottom",
  progress = 1,
  strength = 2,
  style,
  target = "parent",
  width,
  zIndex = 1000,
}: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(animated !== "scroll");
  const isVisible = active && isIntersecting;
  const revealProgress = isVisible ? Math.min(1, Math.max(0, progress)) : 0;

  useEffect(() => {
    if (animated !== "scroll" || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [animated]);

  useEffect(() => {
    if (!isVisible || !animated || !onAnimationComplete) return;

    const durationInMilliseconds = Number.parseFloat(duration) * 1000;
    const timeout = window.setTimeout(onAnimationComplete, durationInMilliseconds);
    return () => window.clearTimeout(timeout);
  }, [animated, duration, isVisible, onAnimationComplete]);

  const layers = useMemo(() => {
    const safeDivCount = Math.max(1, Math.round(divCount));
    const increment = 100 / safeDivCount;
    const currentStrength = isHovered && hoverIntensity
      ? strength * hoverIntensity
      : strength;
    const curveFunction = curveFunctions[curve];

    return Array.from({ length: safeDivCount }, (_, index) => {
      const layer = index + 1;
      const progress = curveFunction(layer / safeDivCount);
      const blurValue = exponential
        ? 2 ** (progress * 4) * 0.0625 * currentStrength
        : 0.0625 * (progress * safeDivCount + 1) * currentStrength;
      const firstStop = Math.round((increment * layer - increment) * 10) / 10;
      const secondStop = Math.round(increment * layer * 10) / 10;
      const thirdStop = Math.round((increment * layer + increment) * 10) / 10;
      const fourthStop = Math.round((increment * layer + increment * 2) * 10) / 10;
      const stops = [
        `transparent ${firstStop}%`,
        `black ${secondStop}%`,
        ...(thirdStop <= 100 ? [`black ${thirdStop}%`] : []),
        ...(fourthStop <= 100 ? [`transparent ${fourthStop}%`] : []),
      ].join(", ");
      const maskImage = `linear-gradient(${gradientDirections[position]}, ${stops})`;

      return (
        <div
          className="gradual-blur__layer"
          key={layer}
          style={{
            backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            maskImage,
            WebkitMaskImage: maskImage,
            opacity,
          }}
        />
      );
    });
  }, [curve, divCount, exponential, hoverIntensity, isHovered, opacity, position, strength]);

  const isVertical = position === "top" || position === "bottom";
  const containerStyle: CSSProperties = {
    position: target === "page" ? "fixed" : "absolute",
    zIndex: target === "page" ? zIndex + 100 : zIndex,
    width: isVertical ? (width ?? "100%") : (width ?? height),
    height: isVertical ? height : "100%",
    opacity: revealProgress,
    transition: animated ? `opacity ${duration} ${easing}` : undefined,
    pointerEvents: hoverIntensity ? "auto" : "none",
    ...(isVertical
      ? { [position]: 0, left: 0, right: 0 }
      : { [position]: 0, top: 0, bottom: 0 }),
    ...style,
  };

  return (
    <div
      aria-hidden="true"
      className={`gradual-blur gradual-blur--${target}${className ? ` ${className}` : ""}`}
      data-progress={revealProgress.toFixed(3)}
      data-visible={revealProgress > 0.001}
      onMouseEnter={hoverIntensity ? () => setIsHovered(true) : undefined}
      onMouseLeave={hoverIntensity ? () => setIsHovered(false) : undefined}
      ref={containerRef}
      style={containerStyle}
    >
      <div className="gradual-blur__inner">{layers}</div>
    </div>
  );
}

export const GradualBlur = memo(GradualBlurComponent);
