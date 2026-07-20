import { gsap } from "gsap";
import {
  type MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";

import { ArrowMark } from "./SmartLink";
import "./FlowingMenu.css";

export interface FlowingMenuItem {
  readonly image: string;
  readonly link: string;
  readonly meta?: string;
  readonly text: string;
}

interface FlowingMenuProps {
  readonly bgColor?: string;
  readonly borderColor?: string;
  readonly items?: readonly FlowingMenuItem[];
  readonly marqueeBgColor?: string;
  readonly marqueeTextColor?: string;
  readonly speed?: number;
  readonly textColor?: string;
}

type ClosestEdge = "top" | "bottom";

const projectFontClasses: Readonly<Record<string, string>> = {
  sef: "flowing-menu__project-font--sef",
  unistays: "flowing-menu__project-font--unistays",
  rewild: "flowing-menu__project-font--rewild",
  "hackathon-management-system": "flowing-menu__project-font--hackathon",
};

function getProjectFontClass(link: string) {
  const slug = link.split("/").filter(Boolean).at(-1) ?? "";
  return projectFontClasses[slug] ?? "";
}

function findClosestEdge(mouseX: number, mouseY: number, width: number, height: number): ClosestEdge {
  const xDifference = mouseX - width / 2;
  const topDistance = xDifference * xDifference + mouseY * mouseY;
  const bottomDifference = mouseY - height;
  const bottomDistance = xDifference * xDifference + bottomDifference * bottomDifference;
  return topDistance < bottomDistance ? "top" : "bottom";
}

export default function FlowingMenu({
  items = [],
  speed = 5,
  textColor = "#fff",
  bgColor = "#120f17",
  marqueeBgColor = "#fff",
  marqueeTextColor = "#120f17",
  borderColor = "#fff",
}: FlowingMenuProps) {
  return (
    <div className="flowing-menu-wrap" style={{ backgroundColor: bgColor }}>
      <nav aria-label="Selected projects" className="flowing-menu">
        {items.map((item, index) => (
          <FlowingMenuRow
            borderColor={borderColor}
            index={index}
            item={item}
            key={item.link}
            marqueeBgColor={marqueeBgColor}
            marqueeTextColor={marqueeTextColor}
            speed={speed}
            textColor={textColor}
          />
        ))}
      </nav>
    </div>
  );
}

interface FlowingMenuRowProps {
  readonly borderColor: string;
  readonly index: number;
  readonly item: FlowingMenuItem;
  readonly marqueeBgColor: string;
  readonly marqueeTextColor: string;
  readonly speed: number;
  readonly textColor: string;
}

function FlowingMenuRow({
  borderColor,
  index,
  item,
  marqueeBgColor,
  marqueeTextColor,
  speed,
  textColor,
}: FlowingMenuRowProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeRevealRef = useRef<HTMLDivElement>(null);
  const marqueeInnerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);
  const revealAnimationRef = useRef<gsap.core.Timeline | null>(null);
  const reducedMotionRef = useRef(false);
  const [repetitions, setRepetitions] = useState(4);
  const projectFontClass = getProjectFontClass(item.link);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => {
      reducedMotionRef.current = mediaQuery.matches;
    };
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    const calculateRepetitions = () => {
      const firstPart = marqueeInnerRef.current?.querySelector<HTMLElement>(
        ".flowing-menu__marquee-part",
      );
      if (!firstPart?.offsetWidth) return;
      setRepetitions(Math.max(4, Math.ceil(window.innerWidth / firstPart.offsetWidth) + 2));
    };

    calculateRepetitions();
    window.addEventListener("resize", calculateRepetitions, { passive: true });
    return () => window.removeEventListener("resize", calculateRepetitions);
  }, [item.image, item.text]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const firstPart = marqueeInnerRef.current?.querySelector<HTMLElement>(
        ".flowing-menu__marquee-part",
      );
      if (!marqueeInnerRef.current || !firstPart?.offsetWidth || reducedMotionRef.current) return;

      animationRef.current?.kill();
      gsap.set(marqueeInnerRef.current, { x: 0 });
      animationRef.current = gsap.to(marqueeInnerRef.current, {
        x: -firstPart.offsetWidth,
        duration: speed,
        ease: "none",
        paused: true,
        repeat: -1,
        repeatRefresh: true,
      });
    }, 50);

    return () => {
      window.clearTimeout(timer);
      animationRef.current?.kill();
      revealAnimationRef.current?.kill();
    };
  }, [item.image, item.text, repetitions, speed]);

  const showMarquee = (edge: ClosestEdge) => {
    if (!marqueeRef.current || !marqueeRevealRef.current || reducedMotionRef.current) return;
    // Vertical reveal and horizontal marquee use separate elements so their
    // transforms can never overwrite one another.
    revealAnimationRef.current?.kill();
    animationRef.current?.restart();
    revealAnimationRef.current = gsap
      .timeline({ defaults: { duration: 0.55, ease: "expo.out" } })
      .set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .set(marqueeRevealRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0)
      .to([marqueeRef.current, marqueeRevealRef.current], { y: "0%" }, 0);
  };

  const hideMarquee = (edge: ClosestEdge) => {
    if (!marqueeRef.current || !marqueeRevealRef.current || reducedMotionRef.current) return;
    revealAnimationRef.current?.kill();
    revealAnimationRef.current = gsap
      .timeline({
        defaults: { duration: 0.55, ease: "expo.out" },
        onComplete: () => animationRef.current?.pause(),
      })
      .to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }, 0)
      .to(marqueeRevealRef.current, { y: edge === "top" ? "101%" : "-101%" }, 0);
  };

  const getEventEdge = (event: MouseEvent<HTMLElement>) => {
    const bounds = itemRef.current?.getBoundingClientRect();
    if (!bounds) return "bottom";
    return findClosestEdge(
      event.clientX - bounds.left,
      event.clientY - bounds.top,
      bounds.width,
      bounds.height,
    );
  };

  const handleFocus = () => showMarquee("bottom");
  const handleBlur = () => hideMarquee("bottom");

  return (
    <div className="flowing-menu__item" ref={itemRef} style={{ borderColor }}>
      <Link
        className="flowing-menu__link"
        onBlur={handleBlur}
        onFocus={handleFocus}
        onMouseEnter={(event) => showMarquee(getEventEdge(event))}
        onMouseLeave={(event) => hideMarquee(getEventEdge(event))}
        style={{ color: textColor }}
        to={item.link}
      >
        <span className="flowing-menu__index">{String(index + 1).padStart(2, "0")}</span>
        <span className={`flowing-menu__text ${projectFontClass}`}>
          {item.text}
        </span>
        <span className="flowing-menu__meta">{item.meta}</span>
        <ArrowMark />
      </Link>
      <div
        aria-hidden="true"
        className="flowing-menu__marquee rounded-md"
        ref={marqueeRef}
        style={{ backgroundColor: marqueeBgColor }}
      >
        <div className="flowing-menu__marquee-wrap" ref={marqueeRevealRef}>
          <div className="flowing-menu__marquee-inner" ref={marqueeInnerRef}>
            {Array.from({ length: repetitions }, (_, repetitionIndex) => (
              <div
                className="flowing-menu__marquee-part"
                key={`${item.link}-${repetitionIndex}`}
                style={{ color: marqueeTextColor }}
              >
                <span className={projectFontClass}>
                  {item.text}
                </span>
                <div
                  className="flowing-menu__image"
                  style={{ backgroundImage: `url("${item.image}")` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
