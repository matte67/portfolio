import { useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";

import {
  workJourneyMedia,
  type WorkJourneyProject,
  type WorkJourneyStop,
} from "../../application/workJourney";
import { ArrowMark, DownMark } from "../components/SmartLink";
import { useWorkJourneyScroll, useWorkJourneyStillFrames } from "./useWorkJourneyScroll";
import "./WorkJourney.css";

interface WorkJourneyProps {
  readonly heading: string;
  readonly readLabel: string;
  readonly routeLabel: string;
  readonly startLabel: string;
  readonly stops: readonly WorkJourneyStop[];
}

function ProjectCard({ project, readLabel }: { project: WorkJourneyProject; readLabel: string }) {
  const summaryId = `work-journey-summary-${project.id}`;
  const content = (
    <>
      <h3>{project.title}</h3>
      <p id={summaryId}>{project.summary}</p>
    </>
  );

  if (!project.href) return <article className="work-journey__card">{content}</article>;

  return (
    <Link
      aria-describedby={summaryId}
      aria-label={`${readLabel} · ${project.title}`}
      className="work-journey__card work-journey__card--link"
      to={project.href}
    >
      {content}
      <span className="work-journey__card-arrow"><ArrowMark /></span>
    </Link>
  );
}

/** Keeps the film full-screen and reveals the matching cards at each island. */
export function WorkJourney({ heading, readLabel, routeLabel, startLabel, stops }: WorkJourneyProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const prefersStillFrames = useWorkJourneyStillFrames();
  const useStillFrames = prefersStillFrames || videoFailed;
  const { activeIndex, revealStop, goToStop, trackRef, stageRef, videoRef } = useWorkJourneyScroll(stops, useStillFrames);
  const railRef = useRef<HTMLElement>(null);
  const currentStop = stops[activeIndex];

  const focusStop = (index: number) => {
    railRef.current?.querySelectorAll("button")[index]?.focus({ preventScroll: true });
    goToStop(index);
  };

  const handleStopKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = stops.length - 1;
    const destinations: Record<string, number> = {
      ArrowLeft: Math.max(0, index - 1),
      ArrowRight: Math.min(last, index + 1),
      Home: 0,
      End: last,
    };
    const destination = destinations[event.key];
    if (destination === undefined) return;

    event.preventDefault();
    focusStop(destination);
  };

  return (
    <section className="work-journey" aria-labelledby="work-journey-title" ref={trackRef}>
      <div className="work-journey__stage" ref={stageRef}>
        <img
          alt=""
          className="work-journey__media"
          fetchPriority={activeIndex === 0 ? "high" : "auto"}
          src={currentStop.poster}
        />
        {!useStillFrames && (
          <video
            aria-hidden="true"
            className="work-journey__media work-journey__video"
            height={workJourneyMedia.height}
            muted
            onError={() => setVideoFailed(true)}
            playsInline
            preload="auto"
            ref={videoRef}
            src={workJourneyMedia.src}
            width={workJourneyMedia.width}
          />
        )}

        <nav aria-label={routeLabel} className="work-journey__rail" ref={railRef}>
          <ol role="list">
            {stops.map((stop, index) => (
              <li key={stop.id}>
                <button
                  aria-current={index === activeIndex ? "step" : undefined}
                  aria-label={stop.label}
                  onClick={() => goToStop(index)}
                  onKeyDown={(event) => handleStopKey(event, index)}
                  tabIndex={index === activeIndex ? 0 : -1}
                  title={stop.label}
                  type="button"
                >
                  <span aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
        </nav>

        <header
          className="work-journey__opening"
          data-visible={activeIndex === 0 && revealStop}
        >
          <h1 id="work-journey-title">{heading}</h1>
          <button
            className="work-journey__start"
            inert={activeIndex !== 0 || !revealStop}
            onClick={() => focusStop(1)}
            type="button"
          >
            <DownMark />
            {startLabel}
          </button>
        </header>

        {stops.slice(1).map((stop) => {
          const visible = currentStop.id === stop.id && revealStop;
          if (stop.projects.length === 0) {
            return (
              <p className="work-journey__caption" data-visible={visible} key={stop.id}>
                {stop.label}
              </p>
            );
          }

          return (
            <section
              aria-labelledby={`work-journey-stop-${stop.id}`}
              className="work-journey__panel"
              data-side={stop.focusX < 0.5 ? "right" : "left"}
              data-visible={visible}
              inert={!visible}
              key={stop.id}
            >
              <h2 className="sr-only" id={`work-journey-stop-${stop.id}`}>{stop.label}</h2>
              <ul role="list">
                {stop.projects.map((project) => (
                  <li key={project.id}><ProjectCard project={project} readLabel={readLabel} /></li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </section>
  );
}
