import { useCallback, useEffect, useRef, useState } from "react";

import { MEDIA_TRAVEL_PX } from "./useEditorialIndexParallax";

interface RollerItem {
  readonly media: HTMLElement;
  readonly root: HTMLElement;
}

function resetRollerParallax(items: readonly RollerItem[]) {
  for (const { media } of items) {
    media.style.removeProperty("--editorial-media-parallax");
  }
}

/**
 * Tracks the media nearest the viewport centre for the editorial roller.
 * Only visible media receive transform updates, keeping scroll work bounded.
 */
export function useEditorialRoller(itemCount: number) {
  const rootRef = useRef<HTMLElement>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);

  const selectItem = useCallback((index: number) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const items = [...root.querySelectorAll<HTMLElement>(".editorial-roller__item")]
      .map((item) => {
        const media = item.querySelector<HTMLElement>(".editorial-roller__media");
        return media ? { media, root: item } : undefined;
      })
      .filter((item): item is RollerItem => item !== undefined);

    if (items.length === 0) return undefined;

    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visibleItems = new Set(items);
    let animationFrame: number | undefined;
    let observer: IntersectionObserver | undefined;

    const update = () => {
      animationFrame = undefined;
      const viewportCenter = window.innerHeight / 2;
      const viewportMultiplier = window.innerWidth < 768 ? 0.5 : 1;
      let nearestIndex = activeIndexRef.current;
      let nearestDistance = Number.POSITIVE_INFINITY;

      for (const item of visibleItems) {
        const index = items.indexOf(item);
        const bounds = item.root.getBoundingClientRect();
        const itemCenter = bounds.top + bounds.height / 2;
        const relativePosition = Math.max(
          -1,
          Math.min(1, (viewportCenter - itemCenter) / (window.innerHeight + bounds.height)),
        );
        if (!reducedMotionQuery.matches) {
          const offset = -relativePosition * MEDIA_TRAVEL_PX * viewportMultiplier;
          item.media.style.setProperty("--editorial-media-parallax", `${offset.toFixed(2)}px`);
        }

        const distance = Math.abs(viewportCenter - itemCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }

      if (nearestIndex !== activeIndexRef.current) selectItem(nearestIndex);
    };

    const scheduleUpdate = () => {
      if (animationFrame === undefined) animationFrame = window.requestAnimationFrame(update);
    };

    const disableMotion = () => {
      if (animationFrame !== undefined) window.cancelAnimationFrame(animationFrame);
      animationFrame = undefined;
      resetRollerParallax(items);
    };

    const handleMotionPreference = () => {
      if (reducedMotionQuery.matches) {
        observer?.disconnect();
        disableMotion();
        scheduleUpdate();
        return;
      }

      for (const { root: item } of items) observer?.observe(item);
      scheduleUpdate();
    };

    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const item = items.find(({ root: itemRoot }) => itemRoot === entry.target);
          if (!item) continue;
          if (entry.isIntersecting) visibleItems.add(item);
          else visibleItems.delete(item);
        }
        scheduleUpdate();
      }, { rootMargin: "20% 0px" });

      for (const { root: item } of items) observer.observe(item);
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
  }, [itemCount, selectItem]);

  return { activeIndex, rootRef, selectItem };
}
