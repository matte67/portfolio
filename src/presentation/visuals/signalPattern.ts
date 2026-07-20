export const SIGNAL_VIEWBOX_WIDTH = 520;
export const SIGNAL_VIEWBOX_HEIGHT = 450;
export const SIGNAL_STRIPE_PERIOD = 5;

export interface SignalPoint {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly opacity: number;
  readonly accent: boolean;
}

export interface SphericalSignalOptions {
  readonly centerX: number;
  readonly centerY: number;
  readonly fieldRadius: number;
  readonly dotScale: number;
}

export function isSignalAccent(index: number): boolean {
  return index % SIGNAL_STRIPE_PERIOD !== 0;
}

/** Creates the perfect spherical state used before the field deforms. */
export function createSphericalSignalPoints(
  count: number,
  options: SphericalSignalOptions,
): readonly SignalPoint[] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  return Array.from({ length: count }, (_, index) => {
    const progress = (index + 0.5) / count;
    const latitude = 1 - progress * 2;
    const radialDistance = Math.sqrt(1 - latitude * latitude);
    const angle = index * goldenAngle;

    return {
      x: options.centerX + Math.cos(angle) * radialDistance * options.fieldRadius,
      y: options.centerY + latitude * options.fieldRadius,
      radius: (0.16 + (Math.sin(angle) + 1) * 0.08) * options.dotScale,
      opacity: 0.18 + progress * 0.42,
      accent: isSignalAccent(index),
    };
  });
}

/**
 * Builds the shared point distribution used by the interactive field and its
 * fixed route-transition preview. Keeping the seed and stripe cadence here
 * prevents the two visuals from drifting apart over time.
 */
export function createSignalPoints(count: number): readonly SignalPoint[] {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  return Array.from({ length: count }, (_, index) => {
    const normalised = (index + 0.5) / count;
    const vertical = 1 - 2 * normalised;
    const ringRadius = Math.sqrt(1 - vertical * vertical);
    const angle = index * goldenAngle;
    const surfaceWave =
      1 +
      0.1 * Math.sin(angle * 3 + vertical * 5) +
      0.045 * Math.cos(angle * 7 - vertical * 9);
    const x3d = ringRadius * Math.cos(angle) * surfaceWave;
    const z3d = ringRadius * Math.sin(angle) * surfaceWave;
    const y3d = vertical * surfaceWave;
    const perspective = 1 + z3d * 0.13;

    return {
      x: 255 + x3d * 164 * perspective,
      y: 225 + y3d * 154 * perspective,
      radius: (0.72 + (z3d + 1) * 0.48) * 1.14,
      opacity: 0.16 + (z3d + 1) * 0.29,
      accent: isSignalAccent(index),
    };
  });
}
