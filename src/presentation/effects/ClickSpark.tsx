import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";

import "./ClickSpark.css";

type SparkEasing = "linear" | "ease-in" | "ease-in-out" | "ease-out";

interface ClickSparkProps {
  readonly children: ReactNode;
  readonly duration?: number;
  readonly easing?: SparkEasing;
  readonly extraScale?: number;
  readonly sparkColor?: string;
  readonly sparkCount?: number;
  readonly sparkRadius?: number;
  readonly sparkSize?: number;
}

interface Spark {
  readonly angle: number;
  readonly startTime: number;
  readonly x: number;
  readonly y: number;
}

function getEasedProgress(progress: number, easing: SparkEasing) {
  switch (easing) {
    case "linear":
      return progress;
    case "ease-in":
      return progress * progress;
    case "ease-in-out":
      return progress < 0.5
        ? 2 * progress * progress
        : -1 + (4 - 2 * progress) * progress;
    default:
      return progress * (2 - progress);
  }
}

/** A viewport-sized click spark adapted from the React Bits ClickSpark component. */
export function ClickSpark({
  sparkColor = "#fff",
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = "ease-out",
  extraScale = 1,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const drawFrameRef = useRef<(timestamp: number) => void>(() => undefined);
  const reducedMotionRef = useRef(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    const nextWidth = Math.round(width * pixelRatio);
    const nextHeight = Math.round(height * pixelRatio);

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.getContext("2d")?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }
  }, []);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      reducedMotionRef.current = mediaQuery.matches;
      if (mediaQuery.matches) {
        sparksRef.current = [];
        canvasRef.current?.getContext("2d")?.clearRect(
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height,
        );
      }
    };

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    window.addEventListener("resize", resizeCanvas, { passive: true });
    resizeCanvas();

    return () => {
      mediaQuery.removeEventListener("change", updateMotionPreference);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [resizeCanvas]);

  const drawFrame = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      animationFrameRef.current = null;
      return;
    }

    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    sparksRef.current = sparksRef.current.filter((spark) => {
      const elapsed = timestamp - spark.startTime;
      if (elapsed >= duration) return false;

      const eased = getEasedProgress(elapsed / duration, easing);
      const distance = eased * sparkRadius * extraScale;
      const lineLength = sparkSize * (1 - eased);
      const cosine = Math.cos(spark.angle);
      const sine = Math.sin(spark.angle);

      context.strokeStyle = sparkColor;
      context.lineWidth = 2;
      context.lineCap = "round";
      context.beginPath();
      context.moveTo(spark.x + distance * cosine, spark.y + distance * sine);
      context.lineTo(
        spark.x + (distance + lineLength) * cosine,
        spark.y + (distance + lineLength) * sine,
      );
      context.stroke();

      return true;
    });

    animationFrameRef.current = sparksRef.current.length > 0
      ? window.requestAnimationFrame((nextTimestamp) => drawFrameRef.current(nextTimestamp))
      : null;
  }, [duration, easing, extraScale, sparkColor, sparkRadius, sparkSize]);

  useEffect(() => {
    drawFrameRef.current = drawFrame;

    return () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawFrame]);

  const handleClick = useCallback((event: globalThis.MouseEvent) => {
    if (reducedMotionRef.current) return;

    const startTime = performance.now();
    const newSparks = Array.from({ length: sparkCount }, (_, index) => ({
      x: event.clientX,
      y: event.clientY,
      angle: (2 * Math.PI * index) / sparkCount,
      startTime,
    }));

    sparksRef.current.push(...newSparks);
    if (animationFrameRef.current === null) {
      animationFrameRef.current = window.requestAnimationFrame(drawFrame);
    }
  }, [drawFrame, sparkCount]);

  useLayoutEffect(() => {
    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]);

  return (
    <Fragment>
      <canvas
        aria-hidden="true"
        className="click-spark__canvas"
        data-testid="click-spark-canvas"
        ref={canvasRef}
      />
      {children}
    </Fragment>
  );
}
