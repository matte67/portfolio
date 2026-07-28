import { useEffect, useRef } from "react";

export const MEDIA_TRAVEL_PX = 348;
const COPY_TRAVEL_PX = 7;
const COMPACT_VIEWPORT_MULTIPLIER = 0.5;

interface ParallaxCard {
  readonly copy: HTMLElement;
  readonly media: HTMLElement;
  readonly root: HTMLElement;
}

function resetParallax(cards: readonly ParallaxCard[]) {
  for (const { copy, media } of cards) {
    copy.style.removeProperty("--editorial-copy-parallax");
    media.style.removeProperty("--editorial-media-parallax");
  }
}

/**
 * Gives editorial cards a small scroll-based depth cue without continuous work
 * for off-screen cards. Motion is disabled for visitors who request less motion.
 */
export function useEditorialIndexParallax(itemCount: number) {
  const indexRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const index = indexRef.current;
    if (!index) return undefined;

    const cards = [...index.querySelectorAll<HTMLElement>(".editorial-card")]
      .map((root) => {
        const media = root.querySelector<HTMLElement>(".editorial-card__media");
        const copy = root.querySelector<HTMLElement>(".editorial-card__copy");
        return media && copy ? { copy, media, root } : undefined;
      })
      .filter((card): card is ParallaxCard => card !== undefined);

    if (cards.length === 0) return undefined;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visibleCards = new Set(cards);
    let animationFrame: number | undefined;
    let observer: IntersectionObserver | undefined;

    const update = () => {
      animationFrame = undefined;
      if (reducedMotionQuery.matches) return;

      const viewportCenter = window.innerHeight / 2;
      const viewportMultiplier = window.innerWidth < 768 ? COMPACT_VIEWPORT_MULTIPLIER : 1;

      for (const { copy, media, root } of visibleCards) {
        const bounds = root.getBoundingClientRect();
        const cardCenter = bounds.top + bounds.height / 2;
        const relativePosition = Math.max(
          -1,
          Math.min(1, (viewportCenter - cardCenter) / (window.innerHeight + bounds.height)),
        );
        const mediaOffset = -relativePosition * MEDIA_TRAVEL_PX * viewportMultiplier;
        const copyOffset = -relativePosition * COPY_TRAVEL_PX * viewportMultiplier;

        media.style.setProperty("--editorial-media-parallax", `${mediaOffset.toFixed(2)}px`);
        copy.style.setProperty("--editorial-copy-parallax", `${copyOffset.toFixed(2)}px`);
      }
    };

    const scheduleUpdate = () => {
      if (animationFrame === undefined) animationFrame = window.requestAnimationFrame(update);
    };

    const disableMotion = () => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
      resetParallax(cards);
    };

    const handleMotionPreference = () => {
      if (reducedMotionQuery.matches) {
        observer?.disconnect();
        disableMotion();
        return;
      }

      for (const { root } of cards) observer?.observe(root);
      scheduleUpdate();
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const card = cards.find(({ root }) => root === entry.target);
          if (!card) continue;
          if (entry.isIntersecting) visibleCards.add(card);
          else visibleCards.delete(card);
        }
        scheduleUpdate();
      }, { rootMargin: "20% 0px" });

      for (const { root } of cards) observer.observe(root);
    }

    reducedMotionQuery.addEventListener("change", handleMotionPreference);
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    handleMotionPreference();

    return () => {
      observer?.disconnect();
      reducedMotionQuery.removeEventListener("change", handleMotionPreference);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("scroll", scheduleUpdate);
      disableMotion();
    };
  }, [itemCount]);

  return indexRef;
}
