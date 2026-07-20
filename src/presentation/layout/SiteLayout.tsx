import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { GradualBlur } from "../effects/GradualBlur";
import { FrameCorner } from "./FrameCorner";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

const NAVIGATION_SCROLL_THRESHOLD = 24;
const BLUR_REVEAL_DISTANCE = 120;
const BLUR_EXIT_DISTANCE = 240;
const SCROLL_DIRECTION_TOLERANCE = 6;

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function SiteLayout() {
  const location = useLocation();
  const { language } = useLanguage();
  const copy = getPageCopy(language, "layout");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);
  const [bottomBlurProgress, setBottomBlurProgress] = useState(0);
  const scrollDirectionAnchorRef = useRef(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location.pathname]);

  useEffect(() => {
    let animationFrame: number | undefined;

    const updateScrollState = () => {
      const scrollTop = window.scrollY;
      const maximumScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const remainingScroll = Math.max(0, maximumScroll - scrollTop);
      const revealProgress = clampProgress(
        (scrollTop - NAVIGATION_SCROLL_THRESHOLD) / BLUR_REVEAL_DISTANCE,
      );
      const exitProgress = clampProgress(remainingScroll / BLUR_EXIT_DISTANCE);
      const scrollDelta = scrollTop - scrollDirectionAnchorRef.current;

      setIsScrolled(scrollTop > NAVIGATION_SCROLL_THRESHOLD);
      setBottomBlurProgress(Math.min(revealProgress, exitProgress));

      if (scrollTop <= NAVIGATION_SCROLL_THRESHOLD) {
        setIsHeaderVisible(false);
        scrollDirectionAnchorRef.current = scrollTop;
      } else if (scrollDelta >= SCROLL_DIRECTION_TOLERANCE) {
        setIsHeaderVisible(false);
        scrollDirectionAnchorRef.current = scrollTop;
      } else if (scrollDelta <= -SCROLL_DIRECTION_TOLERANCE) {
        setIsHeaderVisible(true);
        scrollDirectionAnchorRef.current = scrollTop;
      }
      animationFrame = undefined;
    };
    const handleScroll = () => {
      animationFrame ??= window.requestAnimationFrame(updateScrollState);
    };

    updateScrollState();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#main-content">{copy.accessibility.skipToContent}</a>
      <div className="site-frame">
        <div aria-hidden="true" className="site-frame__viewport" />
        <FrameCorner edge="top" side="left" />
        <FrameCorner edge="top" side="right" />
        <FrameCorner edge="bottom" side="left" />
        <FrameCorner edge="bottom" side="right" />
        <SiteHeader isMerged isVisible={isHeaderVisible} />
        <div className="site-frame__surface">
          <main id="main-content">
            <Outlet />
          </main>
          <SiteFooter />
        </div>
      </div>
      <GradualBlur
        active={isScrolled}
        animated
        className="site-bottom-blur mb-(--frame-gap) px-(--frame-gap)"
        curve="bezier"
        divCount={8}
        duration="0.45s"
        easing="cubic-bezier(0.22, 1, 0.36, 1)"
        exponential
        height="clamp(5rem, 9vw, 8rem)"
        opacity={0.72}
        position="bottom"
        progress={bottomBlurProgress}
        strength={1.8}
        target="page"
        zIndex={-20}
      />
    </>
  );
}
