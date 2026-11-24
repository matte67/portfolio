import { useEffect, useRef, useState, type CSSProperties } from "react";

const MAX_DRIFT_SECONDS = 0.1;

interface FilmComparisonProps {
  readonly guide: { src: string; poster: string; label: string };
  readonly film: { src: string; poster: string; label: string };
  readonly labels: { split: string; play: string; pause: string };
}

/** Keeps the overlapping clips on the same timecode while the divider moves independently. */
export function FilmComparison({ guide, film, labels }: FilmComparisonProps) {
  const [split, setSplit] = useState(25);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [visible, setVisible] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLVideoElement>(null);
  const filmRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!stage.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );
    observer.observe(stage.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPlaying(!preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const primary = filmRef.current;
    const secondary = guideRef.current;
    if (!primary || !secondary || !visible || !playing) return;

    let id: number;
    const sync = () => {
      if (
        !primary.paused &&
        !secondary.seeking &&
        secondary.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        Math.abs(secondary.currentTime - primary.currentTime) >
          MAX_DRIFT_SECONDS
      ) {
        secondary.currentTime = primary.currentTime;
      }
      id = requestAnimationFrame(sync);
    };
    const requests = [primary.play(), secondary.play()];
    let active = true;
    void Promise.all(requests).catch(() => {
      if (active) setPlaying(false);
    });
    id = requestAnimationFrame(sync);

    return () => {
      active = false;
      cancelAnimationFrame(id);
      primary.pause();
      secondary.pause();
    };
  }, [visible, playing]);

  return (
    <div
      className="film-comparison"
      ref={stage}
      style={{ "--film-split": `${split}%` } as CSSProperties}
    >
      <video
        className="film-comparison__film"
        ref={filmRef}
        src={film.src}
        poster={film.poster}
        aria-label={film.label}
        muted
        loop
        playsInline
        preload="none"
      />
      <video
        className="film-comparison__guide"
        ref={guideRef}
        src={guide.src}
        poster={guide.poster}
        aria-label={guide.label}
        muted
        loop
        playsInline
        preload="none"
      />
      {split > 18 && (
        <span
          className="film-comparison__label film-comparison__label--left"
          aria-hidden="true"
        >
          {guide.label}
        </span>
      )}
      {split < 82 && (
        <span
          className="film-comparison__label film-comparison__label--right"
          aria-hidden="true"
        >
          {film.label}
        </span>
      )}
      <div className="film-comparison__divider" aria-hidden="true">
        <span>
          ‹ <b /> ›
        </span>
      </div>
      <input
        className="film-comparison__range"
        type="range"
        min={0}
        max={100}
        value={split}
        aria-label={labels.split}
        onChange={(event) => setSplit(event.currentTarget.valueAsNumber)}
      />
      <button
        className="film-comparison__play"
        type="button"
        onClick={() => setPlaying((value) => !value)}
        aria-label={playing ? labels.pause : labels.play}
      >
        <span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
      </button>
    </div>
  );
}
