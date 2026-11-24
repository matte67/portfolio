import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useLanguage } from "../../application/i18n";
import { signalTelevisionChapterChange } from "../layout/televisionEvents";

interface Section {
  id: string;
  title: string;
  element: HTMLElement;
}

/** Tracks rendered MDX headings, including content arriving after Suspense. */
export function ReadingOutline({ body }: { body: RefObject<HTMLDivElement | null> }) {
  const { language } = useLanguage();
  const [sections, setSections] = useState<Section[]>([]);
  const [active, setActive] = useState(0);
  const [reading, setReading] = useState(false);
  const wheel = useRef<HTMLElement>(null);
  const position = useRef(0);
  const drag = useRef<number | null>(null);
  const dragged = useRef(false);
  const jump = useCallback((index: number) => {
    const section = sections[index];
    if (!section) return;
    const chapterChanged = position.current !== index;
    position.current = index;
    setActive(index);
    section.element.scrollIntoView({ block: "start", behavior: "instant" });
    if (chapterChanged) signalTelevisionChapterChange(section.element);
  }, [sections]);

  useEffect(() => {
    const node = wheel.current;
    if (!node) return;
    let distance = 0;
    let lastStep = -Infinity;
    function scroll(event: WheelEvent) {
      if (event.ctrlKey || !event.deltaY) return;
      const direction = Math.sign(event.deltaY);
      const next = position.current + direction;
      if (!sections[next]) return;
      event.preventDefault();
      if (performance.now() - lastStep < 240) return;
      if (Math.sign(distance) !== direction) distance = 0;
      distance += event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
      if (Math.abs(distance) < 24) return;
      distance = 0;
      lastStep = performance.now();
      jump(next);
    }
    node.addEventListener("wheel", scroll, { passive: false });
    return () => node.removeEventListener("wheel", scroll);
  }, [sections, jump]);

  useEffect(() => {
    const root = body.current;
    if (!root) return;
    let headings: Section[] = [];
    let frame = 0;
    function measure() {
      frame = 0;
      const line = Math.max(150, window.innerHeight * 0.28);
      const bounds = body.current?.getBoundingClientRect();
      setReading(Boolean(bounds && bounds.top <= line && bounds.bottom >= line));
      let current = 0;
      for (const [index, section] of headings.entries()) {
        if (section.element.getBoundingClientRect().top > line) break;
        current = index;
      }
      position.current = current;
      setActive(current);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(measure);
    }
    function collect() {
      headings = Array.from(root!.querySelectorAll<HTMLElement>(":scope > h2, :scope > h3"), (element, index) => {
        if (!element.id) element.id = "reading-section-" + (index + 1);
        return { element, id: element.id, title: element.textContent?.trim() || "" };
      });
      setSections(headings);
      schedule();
    }
    collect();
    const observer = new MutationObserver(collect);
    observer.observe(root, { childList: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      observer.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [body]);

  const current = sections[active];
  if (!current || sections.length < 2) return null;
  const label = language === "it" ? "Indice delle sezioni" : "Section outline";
  return <nav className="section-orbit" data-reading={reading} aria-label={label} ref={wheel}
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      drag.current = event.clientY;
      dragged.current = false;
    }}
    onPointerMove={(event) => {
      if (drag.current === null) return;
      const delta = drag.current - event.clientY;
      if (Math.abs(delta) < 28) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragged.current = true;
      jump(position.current + Math.sign(delta));
      drag.current = event.clientY;
    }}
    onPointerLeave={() => { if (!dragged.current) drag.current = null; }}
    onPointerUp={() => { drag.current = null; }}
    onPointerCancel={() => { drag.current = null; }}
    onKeyDown={(event) => {
      const step = event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0;
      if (!step || !sections[active + step]) return;
      event.preventDefault();
      jump(active + step);
      wheel.current?.querySelector<HTMLButtonElement>(`[data-index="${active + step}"]`)?.focus({ preventScroll: true });
    }}>
    {sections.map((section, index) => {
      const offset = index - active;
      const angle = Math.max(-2, Math.min(2, offset)) * 26;
      const radians = angle * Math.PI / 180;
      return <button key={section.id} data-index={index} type="button"
        data-visible={Math.abs(offset) <= 1} aria-hidden={Math.abs(offset) > 1}
        tabIndex={Math.abs(offset) <= 1 ? 0 : -1}
        aria-current={offset === 0 ? "location" : undefined}
        aria-label={section.title}
        style={{ left: `${8 * Math.cos(radians) - 6.3}em`, top: `calc(50% + ${Math.sin(radians)} * var(--orbit-y-radius, 8em))`,
          transform: `translateY(-50%) rotate(${angle}deg)` }}
        onClick={(event) => { if (!dragged.current || event.detail === 0) jump(index); }}>
        <b>{String(index + 1).padStart(2, "0")}</b>
        <span>{section.title}</span>
      </button>;
    })}
  </nav>;
}
