uniform vec2 uSize;
uniform float uTime;
uniform float uMotion;
uniform float uTransition;
uniform vec4 uDisturbances[3];
uniform float uCrests[3];
varying vec2 vUv;

const float PI = 3.14159265;
const float LINE_PITCH = 4.7;
const float PHOSPHOR_PITCH = 5.7;

float grain(vec2 cell) {
  vec3 p = fract(vec3(cell.xyx) * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

// Center the raster on a shallow cylindrical face, with a gentler vertical bow.
vec2 curvedRaster(vec2 p) {
  vec2 edge = p * p;
  return 0.5 + 0.5 * p * vec2(1.0 + edge.x * 0.035, 1.0 + edge.x * 0.085 + edge.y * 0.012);
}

float displacedRasterY(vec2 screenPx) {
  float displacement = 0.0;
  for (int index = 0; index < 3; index++) {
    vec4 field = uDisturbances[index];
    if (field.w == 0.0) continue;
    vec2 delta = screenPx - field.xy;
    float distanceToCenter = length(delta);
    float envelope = max(0.0, 1.0 - distanceToCenter / max(field.z, 1.0));
    float bend = envelope * envelope;
    if (uCrests[index] >= 0.0) {
      float phase = (distanceToCenter - uCrests[index]) / 28.0;
      bend = sin(clamp(phase, -1.0, 1.0) * PI) * max(0.0, 1.0 - abs(phase)) * envelope;
    }
    // Inverse sampling moves the displayed lines inward while the glass is pressed.
    displacement += delta.y * field.w * bend;
  }
  return displacement;
}

// RGB phosphors are anchored to the glass. The beam moves over the vertical grille.
vec3 phosphorApertures(float rasterX) {
  float phase = rasterX / PHOSPHOR_PITCH;
  vec3 centers = vec3(1.0 / 6.0, 0.5, 5.0 / 6.0);
  vec3 distanceFromCenter = abs(fract(vec3(phase + 0.5) - centers) - 0.5);
  float antialias = clamp(fwidth(phase) * 0.45, 0.018, 0.11);
  return 1.0 - smoothstep(
    vec3(0.113 - antialias),
    vec3(0.113 + antialias),
    distanceFromCenter
  );
}

void main() {
  vec2 centered = vUv * 2.0 - 1.0;
  vec2 screenPx = vUv * uSize;
  vec2 raster = curvedRaster(centered) * uSize;
  float rasterY = raster.y + displacedRasterY(screenPx) + uTime * 22.0;

  float row = floor(rasterY / LINE_PITCH);
  float textureTick = floor(uTime * 14.0);
  float signal = grain(vec2(row, textureTick * 0.19));
  float transitionBand = step(0.81, grain(vec2(floor(rasterY / 11.0), textureTick + 71.0)));
  rasterY += transitionBand * uTransition * (signal - 0.5) * 6.0;

  float linePhase = abs(fract(rasterY / LINE_PITCH + 0.5) - 0.5);
  float softEdge = clamp(fwidth(rasterY / LINE_PITCH) * 0.5, 0.04, 0.22);
  float scanline = 1.0 - smoothstep(0.045, 0.045 + softEdge, linePhase);
  float rowGain = 0.075 + 0.033 * sin(row * 0.89 + uTime * 2.1) + (signal - 0.5) * 0.018;

  vec3 apertures = phosphorApertures(raster.x);
  float grilleCoverage = clamp(dot(apertures, vec3(1.0)), 0.0, 1.0);
  float beam = 1.0 - scanline * 0.52;
  float phosphorGain = beam * (0.064 + transitionBand * uTransition * 0.019);
  vec3 phosphorLight = (
    apertures.r * vec3(1.0, 0.29, 0.25)
    + apertures.g * vec3(0.29, 0.93, 0.39)
    + apertures.b * vec3(0.30, 0.47, 1.0)
  ) * phosphorGain;

  vec2 edge = centered * centered;
  float distanceFromCenter = dot(edge, vec2(0.62, 0.58));
  float vignette = 0.097 * smoothstep(0.30, 1.20, distanceFromCenter);
  vec3 normal = normalize(vec3(centered * vec2(0.38, 0.25), 1.0));
  vec3 light = normalize(vec3(-0.28, 0.18, 1.0));
  float reflection = pow(max(dot(normal, light), 0.0), 71.0);
  float glass = reflection * 0.078;
  float rim = smoothstep(0.78, 1.01, abs(centered.x)) * (1.0 - edge.y) * 0.019;

  float sweepY = fract(uTime / 14.0 + 0.21) * 1.4 - 0.2;
  float sweep = 1.0 - smoothstep(0.0, 0.13, abs(vUv.y - sweepY));
  float flicker = uMotion * (0.5 + 0.5 * sin(uTime * 7.1) * sin(uTime * 17.3));
  float noise = (grain(floor(screenPx / 2.0) + textureTick * vec2(13.1, 7.9)) - 0.5) * 0.019;

  float dark = scanline * rowGain + vignette + flicker * 0.012 + max(0.0, -noise);
  dark += (1.0 - grilleCoverage) * 0.038;
  float white = glass + rim + sweep * 0.044 * uMotion + max(0.0, noise);
  float alpha = dark + white + dot(apertures, vec3(phosphorGain));
  vec3 color = (vec3(0.085, 0.075, 0.064) * dark
    + vec3(1.0, 0.97, 0.91) * white + phosphorLight) / max(alpha, 0.001);

  gl_FragColor = vec4(color, alpha);
}
