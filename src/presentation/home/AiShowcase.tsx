import { faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import "./AiShowcase.css";

const campaign = {
  frame: "/media/unistays/iphone-6s-frame.png",
  poster: "/media/unistays/a-due-passi-poster.webp",
  video: "/media/unistays/a-due-passi.mp4",
};

/** The campaign plays in a layered phone whose angle follows the section's scroll progress. */
export function AiShowcase() {
  const { language } = useLanguage();
  const copy = getPageCopy(language, "home").ai;
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", "end start"],
  });
  const rotateY = useTransform(scrollYProgress, [0, 1], [-28, 25]);
  const rotateX = useTransform(scrollYProgress, [0, 1], [16, -13]);
  const y = useTransform(scrollYProgress, [0, 1], [14, -14]);

  async function toggleCampaign() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      return;
    }
    setFailed(false);
    if (video.error) video.load();

    try {
      await video.play();
    } catch {
      setFailed(true);
    }
  }

  return (
    <section
      aria-labelledby="ai-showcase-title"
      className="ai-showcase page-shell section-space"
      id="ai"
    >
      <div className="ai-showcase__copy">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h2 id="ai-showcase-title">{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <figure className="ai-showcase__figure">
        <div className="ai-showcase__stage" ref={stageRef}>
          <motion.div
            className="ai-showcase__phone"
            style={reducedMotion ? undefined : { rotateX, rotateY, y }}
          >
            <div className="ai-showcase__screen">
              <video
                aria-label={copy.videoLabel}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onError={() => {
                  setPlaying(false);
                  setFailed(true);
                }}
                onClick={toggleCampaign}
                playsInline
                poster={campaign.poster}
                preload="none"
                ref={videoRef}
                src={campaign.video}
                tabIndex={-1}
              />

              <div className="campaign-reel">
                <span className="campaign-reel__title">Reels</span>
                <div className="campaign-reel__icons" aria-hidden="true">
                  {[
                    ["heart", language === "it" ? "17,3 mila" : "17.3K"],
                    ["comment", "108"],
                    ["share", ""],
                  ].map(([icon, count]) => (
                    <span className="campaign-reel__metric" key={icon}>
                      <img alt="" src={`/media/unistays/reel-${icon}.png`} />
                      {count}
                    </span>
                  ))}
                </div>
                <div className="campaign-reel__byline">
                  <img alt="" src="/media/unistays/FullcoloredLogo.svg" />
                  <strong>@unistays</strong>
                </div>
                <p lang="it">
                  A due passi dall’uni dicevano… 🥾 Trova la tua stanza con
                  UniStays.
                </p>
              </div>
              <button
                aria-label={playing ? copy.pause : copy.play}
                data-playing={playing}
                className="ai-showcase__play"
                onClick={toggleCampaign}
                type="button"
              >
                <FontAwesomeIcon
                  aria-hidden="true"
                  icon={playing ? faPause : faPlay}
                />
              </button>
            </div>
            <img
              alt=""
              className="ai-showcase__frame"
              height={1536}
              loading="lazy"
              src={campaign.frame}
              width={1024}
            />
          </motion.div>
        </div>
        {failed && (
          <p className="ai-showcase__error" role="status">
            {copy.error}
          </p>
        )}
      </figure>
    </section>
  );
}
