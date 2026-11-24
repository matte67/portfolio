import { useEffect, useRef, useState, type PointerEvent } from "react";
import {
  Color, DirectionalLight, Fog, HemisphereLight, Mesh, PerspectiveCamera,
  Quaternion, Scene, Texture, Vector3, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

type Pose = [number, number, number, number, number, number, number];
interface CameraTrack {
  fov: number;
  poses: Pose[];
}

const MAX_PIXEL_RATIO = 2;
const MEDIA_ROOT = "/media/process";
const TRAVEL_STEPS = 1000;

function disposeModel(scene: Scene) {
  const textures = new Set<Texture>();
  scene.traverse((object) => {
    if (!(object instanceof Mesh)) return;

    object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture) textures.add(value);
      }
      material.dispose();
    }
  });
  for (const texture of textures) {
    texture.dispose();
    if (texture.source.data instanceof ImageBitmap) texture.source.data.close();
  }
}

async function fetchAsset(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Could not load ${url}`);
  return response;
}

/** Renders a Blender export along its baked camera path on drag, touch or keyboard input. */
export default function BlenderJourney({ model, title, label }: {
  model: string; title: string; label: string;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const renderAt = useRef<(progress: number) => void>(() => {});
  const progressRef = useRef(0);
  const drag = useRef<{ x: number; progress: number } | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">("loading");

  useEffect(() => {
    const host = surface.current;
    const target = canvas.current;
    if (!host || !target) return;

    const abort = new AbortController();
    let renderer: WebGLRenderer | undefined;
    let resize: ResizeObserver | undefined;
    const scene = new Scene();
    const background = new Color(getComputedStyle(host).backgroundColor);
    scene.background = background;
    scene.fog = new Fog(background, 36, 175);
    scene.add(new HemisphereLight(0xe5f4ff, 0xc39678, 2.15));
    const sun = new DirectionalLight(0xffe5cb, 2.4);
    sun.position.set(-5, 9, 4);
    scene.add(sun);

    const load = async () => {
      try {
        renderer = new WebGLRenderer({ canvas: target, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
        const [bytes, track] = await Promise.all([
          fetchAsset(`${MEDIA_ROOT}/${model}.glb`, abort.signal).then((response) => response.arrayBuffer()),
          fetchAsset(`${MEDIA_ROOT}/${model}.json`, abort.signal).then((response) => response.json() as Promise<CameraTrack>),
        ]);
        const { scene: modelScene } = await new GLTFLoader().parseAsync(bytes, `${MEDIA_ROOT}/`);
        if (abort.signal.aborted || !renderer) {
          const discarded = new Scene();
          discarded.add(modelScene);
          disposeModel(discarded);
          return;
        }

        scene.add(modelScene);
        const activeRenderer = renderer;
        const camera = new PerspectiveCamera(track.fov, 16 / 9, 0.12, 320);
        const nextPosition = new Vector3();
        const nextRotation = new Quaternion();

        const draw = (value: number) => {
          const frame = value / TRAVEL_STEPS * (track.poses.length - 1);
          const index = Math.floor(frame);
          const from = track.poses[index];
          const to = track.poses[Math.min(index + 1, track.poses.length - 1)];
          camera.position.set(from[0], from[1], from[2]).lerp(nextPosition.set(to[0], to[1], to[2]), frame - index);
          camera.quaternion.set(from[3], from[4], from[5], from[6]).slerp(nextRotation.set(to[3], to[4], to[5], to[6]), frame - index);
          activeRenderer.render(scene, camera);
        };
        const fit = () => {
          camera.aspect = host.clientWidth / host.clientHeight;
          camera.updateProjectionMatrix();
          activeRenderer.setSize(host.clientWidth, host.clientHeight, false);
          draw(progressRef.current);
        };
        resize = new ResizeObserver(fit);
        resize.observe(host);
        renderAt.current = draw;
        fit();
        setStatus("ready");
      } catch {
        if (!abort.signal.aborted) setStatus("fallback");
      }
    };
    const intersection = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      intersection.disconnect();
      void load();
    }, { rootMargin: "160px" });
    intersection.observe(host);
    const handleContextLoss = () => setStatus("fallback");
    target.addEventListener("webglcontextlost", handleContextLoss);

    return () => {
      abort.abort();
      intersection.disconnect();
      resize?.disconnect();
      target.removeEventListener("webglcontextlost", handleContextLoss);
      renderAt.current = () => {};
      disposeModel(scene);
      renderer?.dispose();
    };
  }, [model]);

  const seek = (value: number) => {
    const next = Math.max(0, Math.min(TRAVEL_STEPS, value));
    progressRef.current = next;
    setProgress(next);
    renderAt.current(next);
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (status !== "ready" || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, progress: progressRef.current };
  };

  return (
    <div className="blender-journey">
      <div
        className="blender-journey__viewport"
        data-status={status}
        onPointerDown={startDrag}
        onPointerMove={(event) => {
          if (!drag.current) return;
          seek(Math.round(drag.current.progress + (event.clientX - drag.current.x) * TRAVEL_STEPS / event.currentTarget.clientWidth));
        }}
        onLostPointerCapture={() => { drag.current = null; }}
        ref={surface}
      >
        {status !== "ready" && <img src={`${MEDIA_ROOT}/${model}.webp`} alt={title} loading="lazy" />}
        <canvas ref={canvas} role="img" aria-label={title} hidden={status !== "ready"} />
      </div>
      {status !== "fallback" && (
        <label className="blender-journey__controls">
          <span>{label}</span>
          <input type="range" min={0} max={TRAVEL_STEPS} value={progress} disabled={status !== "ready"}
            onChange={(event) => seek(event.currentTarget.valueAsNumber)} />
        </label>
      )}
    </div>
  );
}
