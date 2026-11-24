import {
  Mesh,
  NoBlending,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  WebGLRenderer,
} from "three";

import fragmentShader from "./television.frag.glsl?raw";

const MAX_RENDER_PIXELS = 1_300_000;
const MAX_PIXEL_RATIO = 1.25;
const DISTURBANCE_COUNT = 3;

export interface ScreenPoint {
  readonly x: number;
  readonly y: number;
}

export interface RasterDisturbance extends ScreenPoint {
  readonly radius: number;
  readonly strength: number;
  readonly crest?: number;
}

interface TelevisionFrame {
  readonly seconds: number;
  readonly animated: boolean;
  readonly transition: number;
  readonly disturbances: readonly RasterDisturbance[];
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/** Draws the optical layer in one WebGL pass over live HTML. */
export function createTelevisionRenderer(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    premultipliedAlpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    failIfMajorPerformanceCaveat: true,
  });
  let shaderFailed = false;
  renderer.debug.onShaderError = () => { shaderFailed = true; };
  const uniforms = {
    uSize: { value: new Vector2() },
    uTime: { value: 0 },
    uMotion: { value: 1 },
    uTransition: { value: 0 },
    uDisturbances: { value: Array.from({ length: DISTURBANCE_COUNT }, () => new Vector4()) },
    uCrests: { value: new Float32Array(DISTURBANCE_COUNT).fill(-1) },
  };
  const geometry = new PlaneGeometry(2, 2);
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    blending: NoBlending,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
  });
  const scene = new Scene();
  const screen = new Mesh(geometry, material);
  screen.frustumCulled = false;
  scene.add(screen);
  const camera = new OrthographicCamera();

  return {
    resize(width: number, height: number, devicePixelRatio: number) {
      const scale = Math.min(devicePixelRatio, MAX_PIXEL_RATIO, Math.sqrt(MAX_RENDER_PIXELS / (width * height)));
      const drawWidth = Math.max(1, Math.round(width * scale));
      const drawHeight = Math.max(1, Math.round(height * scale));
      uniforms.uSize.value.set(width, height);

      if (canvas.width !== drawWidth || canvas.height !== drawHeight) renderer.setSize(drawWidth, drawHeight, false);
    },
    draw({ seconds, animated, transition, disturbances }: TelevisionFrame) {
      uniforms.uTime.value = seconds;
      uniforms.uMotion.value = Number(animated);
      uniforms.uTransition.value = transition;

      uniforms.uDisturbances.value.forEach((slot, index) => {
        const disturbance = disturbances[index];
        if (disturbance) {
          slot.set(disturbance.x, uniforms.uSize.value.y - disturbance.y, disturbance.radius, disturbance.strength);
        } else {
          slot.set(0, 0, 1, 0);
        }
        uniforms.uCrests.value[index] = disturbance?.crest ?? -1;
      });
      renderer.render(scene, camera);
      return !shaderFailed;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    },
  };
}
