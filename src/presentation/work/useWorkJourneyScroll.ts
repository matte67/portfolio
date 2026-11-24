import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { workJourneyMedia, type WorkJourneyStop } from "../../application/workJourney";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const CARD_WINDOW_SECONDS = 0.51;
const CARD_WINDOW_FRAMES = Math.floor(CARD_WINDOW_SECONDS * workJourneyMedia.fps);

function subscribeToMotionPreference(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Tracks changes to the system preference without having to reload the journey. */
export function useWorkJourneyStillFrames() {
  return useSyncExternalStore(subscribeToMotionPreference, prefersReducedMotion, () => false);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getScrollGeometry(track: HTMLElement, stage: HTMLDivElement) {
  const bounds = track.getBoundingClientRect();
  const stickyTop = Number.parseFloat(getComputedStyle(stage).top);
  return {
    distanceToStart: bounds.top - stickyTop,
    scrollLength: Math.max(1, bounds.height - stage.clientHeight),
  };
}

function findClosestStop(frame: number, stops: readonly WorkJourneyStop[]) {
  const after = stops.findIndex((stop) => stop.frame >= frame);
  if (after <= 0) return after === 0 ? 0 : stops.length - 1;

  return stops[after].frame - frame < frame - stops[after - 1].frame ? after : after - 1;
}

function focusAtFrame(frame: number, index: number, stops: readonly WorkJourneyStop[]) {
  const stop = stops[index];
  const nextIndex = clamp(index + Math.sign(frame - stop.frame), 0, stops.length - 1);
  if (nextIndex === index) return stop.focusX;

  const next = stops[nextIndex];
  const t = (frame - stop.frame) / (next.frame - stop.frame);
  const eased = t * t * (3 - 2 * t);
  return stop.focusX + (next.focusX - stop.focusX) * eased;
}

/** Scrubs a paused video and coalesces scroll updates while the browser decodes a seek. */
export function useWorkJourneyScroll(stops: readonly WorkJourneyStop[], useStillFrames: boolean) {
  const trackRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [{ activeIndex, revealStop }, setScene] = useState({ activeIndex: 0, revealStop: true });

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const video = useStillFrames ? null : videoRef.current;
    let request: number | undefined;
    let wantedFrame = 0;
    let visibleSourceWidth = 1;
    stage.dataset.videoReady = "false";

    const measureCrop = () => {
      const mediaAspect = workJourneyMedia.width / workJourneyMedia.height;
      visibleSourceWidth = Math.min(1, stage.clientWidth / (stage.clientHeight * mediaAspect));
    };

    const presentFrame = (frame: number, asStill: boolean) => {
      const index = findClosestStop(frame, stops);
      const stop = stops[index];
      const focusX = asStill ? stop.focusX : focusAtFrame(frame, index, stops);
      // Translate a source-space focal point to the offset expected by object-position.
      const objectPosition = visibleSourceWidth < 1
        ? clamp((focusX - visibleSourceWidth / 2) / (1 - visibleSourceWidth), 0, 1)
        : 0.5;
      stage.style.setProperty("--journey-object-x", `${objectPosition * 100}%`);

      const isWithinWindow = asStill || Math.abs(stop.frame - frame) <= CARD_WINDOW_FRAMES;
      const show = isWithinWindow || stop.id === "temple" && frame >= stop.frame - workJourneyMedia.fps;
      setScene((previous) => previous.activeIndex === index && previous.revealStop === show
        ? previous
        : { activeIndex: index, revealStop: show });
    };

    const presentDecodedFrame = () => {
      if (!video || video.seeking || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

      stage.dataset.videoReady = "true";
      const frame = clamp(Math.floor(video.currentTime * workJourneyMedia.fps), 0, workJourneyMedia.lastFrame);
      presentFrame(frame, false);
    };

    const seekToWantedFrame = () => {
      if (!video || video.readyState < HTMLMediaElement.HAVE_METADATA) {
        presentFrame(wantedFrame, true);
        return;
      }

      if (video.seeking) return;

      if (Math.floor(video.currentTime * workJourneyMedia.fps) !== wantedFrame) {
        // A position inside the frame avoids rounding back to its predecessor in MP4.
        video.currentTime = (wantedFrame + 0.25) / workJourneyMedia.fps;
      } else {
        presentDecodedFrame();
      }
    };

    const handleSeeked = () => {
      if (Math.floor((video?.currentTime ?? 0) * workJourneyMedia.fps) !== wantedFrame) {
        presentDecodedFrame();
      }
      seekToWantedFrame();
    };

    const updateFromScroll = () => {
      request = undefined;
      const { distanceToStart, scrollLength } = getScrollGeometry(track, stage);
      const progress = clamp(-distanceToStart / scrollLength, 0, 1);
      wantedFrame = Math.round(progress * workJourneyMedia.lastFrame);
      stage.style.setProperty("--journey-progress", `${progress * 100}%`);
      seekToWantedFrame();
    };

    const scheduleUpdate = () => {
      request ??= window.requestAnimationFrame(updateFromScroll);
    };

    const handleResize = () => {
      measureCrop();
      if (stage.dataset.videoReady === "true") presentDecodedFrame();
      scheduleUpdate();
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(stage);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    video?.addEventListener("loadedmetadata", scheduleUpdate);
    video?.addEventListener("loadeddata", presentDecodedFrame);
    video?.addEventListener("seeked", handleSeeked);
    measureCrop();
    scheduleUpdate();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      video?.removeEventListener("loadedmetadata", scheduleUpdate);
      video?.removeEventListener("loadeddata", presentDecodedFrame);
      video?.removeEventListener("seeked", handleSeeked);
      if (request !== undefined) window.cancelAnimationFrame(request);
    };
  }, [stops, useStillFrames]);

  const goToStop = (index: number) => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    const { distanceToStart, scrollLength } = getScrollGeometry(track, stage);
    const offset = scrollLength * stops[index].frame / workJourneyMedia.lastFrame;
    window.scrollTo({ top: window.scrollY + distanceToStart + offset, behavior: "instant" });
  };

  return { activeIndex, revealStop, goToStop, trackRef, stageRef, videoRef };
}
