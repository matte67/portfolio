import * as m from "motion/react-m";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import "./DecryptedText.css";

type AnimationDirection = "forward" | "reverse";
type AnimationTrigger = "click" | "hover" | "inViewHover" | "view";
type ClickMode = "once" | "toggle";
type RevealDirection = "center" | "end" | "start";

interface DecryptedTextProps {
  readonly animateOn?: AnimationTrigger;
  readonly characters?: string;
  readonly className?: string;
  readonly clickMode?: ClickMode;
  readonly encryptedClassName?: string;
  readonly maxIterations?: number;
  readonly parentClassName?: string;
  readonly revealDirection?: RevealDirection;
  readonly sequential?: boolean;
  readonly speed?: number;
  readonly text: string;
  readonly useOriginalCharsOnly?: boolean;
}

const DEFAULT_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*+?";

function scrambleText(
  text: string,
  availableCharacters: readonly string[],
  revealed: ReadonlySet<number>,
) {
  return Array.from(text, (character, index) => {
    if (character === " " || revealed.has(index)) return character;
    return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
  }).join("");
}

function getRevealOrder(text: string, direction: RevealDirection): readonly number[] {
  const indices = Array.from(text, (character, index) => ({ character, index }))
    .filter(({ character }) => character !== " ")
    .map(({ index }) => index);

  if (direction === "end") return indices.reverse();
  if (direction === "start") return indices;

  const center = (text.length - 1) / 2;
  return indices.sort((left, right) => {
    const distanceDifference = Math.abs(left - center) - Math.abs(right - center);
    return distanceDifference === 0 ? left - right : distanceDifference;
  });
}

/**
 * Accessible React Bits text-decryption effect adapted for TypeScript.
 * The animated glyphs are decorative; assistive technology receives only the original text.
 */
export function DecryptedText({
  text,
  speed = 50,
  maxIterations = 10,
  sequential = false,
  revealDirection = "start",
  useOriginalCharsOnly = false,
  characters = DEFAULT_CHARACTERS,
  className = "",
  parentClassName = "",
  encryptedClassName = "",
  animateOn = "hover",
  clickMode = "once",
}: DecryptedTextProps) {
  const availableCharacters = useMemo(() => {
    const source = useOriginalCharsOnly
      ? Array.from(new Set(text.replaceAll(" ", "")))
      : Array.from(characters);
    return source.length > 0 ? source : ["•"];
  }, [characters, text, useOriginalCharsOnly]);

  const [displayText, setDisplayText] = useState(() => (
    animateOn === "click"
      ? scrambleText(text, availableCharacters, new Set())
      : text
  ));
  const [direction, setDirection] = useState<AnimationDirection>("forward");
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDecrypted, setIsDecrypted] = useState(animateOn !== "click");
  const [revealedIndices, setRevealedIndices] = useState<ReadonlySet<number>>(
    () => new Set(),
  );

  const containerRef = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pointerRef = useRef(0);
  const reducedMotionRef = useRef(false);
  const revealOrder = useMemo(
    () => getRevealOrder(text, revealDirection),
    [revealDirection, text],
  );

  const stopInterval = useCallback(() => {
    if (intervalRef.current === null) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const fillAllIndices = useCallback(
    () => new Set(revealOrder),
    [revealOrder],
  );

  const shuffleText = useCallback(
    (revealed: ReadonlySet<number>) => scrambleText(text, availableCharacters, revealed),
    [availableCharacters, text],
  );

  const showPlainText = useCallback(() => {
    stopInterval();
    setDisplayText(text);
    setDirection("forward");
    setIsAnimating(false);
    setIsDecrypted(true);
    setRevealedIndices(fillAllIndices());
  }, [fillAllIndices, stopInterval, text]);

  const triggerDecrypt = useCallback(() => {
    if (reducedMotionRef.current) {
      showPlainText();
      return;
    }

    pointerRef.current = 0;
    const revealed = new Set<number>();
    setDirection("forward");
    setIsDecrypted(false);
    setRevealedIndices(revealed);
    setDisplayText(shuffleText(revealed));
    setIsAnimating(true);
  }, [showPlainText, shuffleText]);

  const triggerReverse = useCallback(() => {
    if (reducedMotionRef.current) {
      showPlainText();
      return;
    }

    pointerRef.current = 0;
    const revealed = fillAllIndices();
    setDirection("reverse");
    setRevealedIndices(revealed);
    setDisplayText(text);
    setIsAnimating(true);
  }, [fillAllIndices, showPlainText, text]);

  useLayoutEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      reducedMotionRef.current = mediaQuery.matches;
      if (mediaQuery.matches) showPlainText();
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, [showPlainText]);

  useEffect(() => {
    if (!isAnimating) return;

    let iteration = 0;
    intervalRef.current = setInterval(() => {
      setRevealedIndices((currentRevealed) => {
        if (sequential) {
          const nextIndex = revealOrder[pointerRef.current];
          if (nextIndex === undefined) {
            showPlainText();
            return currentRevealed;
          }

          pointerRef.current += 1;
          const nextRevealed = new Set(currentRevealed);
          if (direction === "forward") {
            nextRevealed.add(nextIndex);
          } else {
            nextRevealed.delete(nextIndex);
          }
          setDisplayText(shuffleText(nextRevealed));

          if (pointerRef.current >= revealOrder.length) {
            if (direction === "forward") {
              showPlainText();
            } else {
              stopInterval();
              setIsAnimating(false);
              setIsDecrypted(false);
            }
          }
          return nextRevealed;
        }

        iteration += 1;
        if (direction === "forward") {
          setDisplayText(shuffleText(currentRevealed));
          if (iteration >= maxIterations) showPlainText();
          return currentRevealed;
        }

        const candidates = Array.from(currentRevealed);
        const removeCount = Math.max(1, Math.ceil(text.length / maxIterations));
        const nextRevealed = new Set(currentRevealed);
        for (let index = 0; index < removeCount && candidates.length > 0; index += 1) {
          const candidateIndex = Math.floor(Math.random() * candidates.length);
          const [removed] = candidates.splice(candidateIndex, 1);
          nextRevealed.delete(removed);
        }
        setDisplayText(shuffleText(nextRevealed));
        if (nextRevealed.size === 0 || iteration >= maxIterations) {
          stopInterval();
          setIsAnimating(false);
          setIsDecrypted(false);
        }
        return nextRevealed;
      });
    }, speed);

    return stopInterval;
  }, [
    direction,
    isAnimating,
    maxIterations,
    revealOrder,
    sequential,
    showPlainText,
    shuffleText,
    speed,
    stopInterval,
    text.length,
  ]);

  useEffect(() => {
    if (animateOn !== "view" && animateOn !== "inViewHover") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || hasAnimated) return;
      triggerDecrypt();
      setHasAnimated(true);
    }, { threshold: 0.1 });
    const container = containerRef.current;
    if (container) observer.observe(container);

    return () => observer.disconnect();
  }, [animateOn, hasAnimated, triggerDecrypt]);

  useEffect(() => stopInterval, [stopInterval]);

  const handleClick = () => {
    if (animateOn !== "click" || (clickMode === "once" && isDecrypted)) return;
    if (clickMode === "toggle" && isDecrypted) {
      triggerReverse();
      return;
    }
    triggerDecrypt();
  };

  const handleMouseEnter = () => {
    if ((animateOn === "hover" || animateOn === "inViewHover") && !isAnimating) {
      triggerDecrypt();
    }
  };

  const handleMouseLeave = () => {
    if (animateOn === "hover" || animateOn === "inViewHover") showPlainText();
  };

  return (
    <m.span
      className={`decrypted-text ${parentClassName}`.trim()}
      data-animating={isAnimating ? "true" : "false"}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={containerRef}
    >
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true" className="decrypted-text__visual">
        {Array.from(displayText, (character, index) => {
          const isRevealed = revealedIndices.has(index) || (!isAnimating && isDecrypted);
          const stateClassName = isRevealed ? className : encryptedClassName;
          return (
            <span
              className="decrypted-text__character"
              data-original-character={text[index] ?? character}
              key={`${index}-${text[index] ?? "character"}`}
            >
              <span className={`decrypted-text__glyph ${stateClassName}`.trim()}>
                {character}
              </span>
            </span>
          );
        })}
      </span>
    </m.span>
  );
}
