import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faBars, faEnvelope, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";

import { useLanguage } from "../../application/i18n";
import { getPageCopy } from "../../application/pageCopy";
import { ArrowMark } from "../components/SmartLink";
import { FrameCorner } from "./FrameCorner";

const desktopLinkClass =
  "relative inline-flex min-h-10 items-center gap-1.5 text-[0.86rem] font-semibold no-underline after:absolute after:right-0 after:bottom-1 after:left-0 after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-200 hover:after:origin-left hover:after:scale-x-100";

interface SiteHeaderProps {
  readonly isMerged: boolean;
  readonly isVisible: boolean;
}

export function SiteHeader({ isMerged, isVisible }: SiteHeaderProps) {
  const { language, setLanguage } = useLanguage();
  const copy = getPageCopy(language, "layout");
  const primaryNavigation = [[copy.navigation.work, "/work"], [copy.navigation.articles, "/articles"], [copy.navigation.thesis, "/thesis"], [copy.navigation.about, "/about"]] as const;
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const navigationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle("menu-open", isOpen);
    if (isOpen) closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === "Escape") {
        setIsOpen(false);
        requestAnimationFrame(() => menuButtonRef.current?.focus());
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = navigationRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.classList.remove("menu-open");
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  const isHeaderVisible = isVisible || isOpen;

  return (
    <>
      <header
        className={`site-header${isHeaderVisible ? " is-visible" : " hover:is-visible"}  mt-(--frame-gap) mx-8`}
        data-merged={isMerged ? "true" : "false"}
        data-menu-open={isOpen ? "true" : "false"}
        data-visible={isHeaderVisible}
        inert={!isHeaderVisible}
      >
        <FrameCorner anchor="left" edge="top" position="absolute" side="right" roundness={1} size="1.5rem" rotation={0} />
        <FrameCorner anchor="right" edge="top" position="absolute" side="left" roundness={1} size="1.5rem" />

        <div className={`site-header__inner ${isHeaderVisible ? "rounded-b-3xl!" : "rounded-b-[6rem]!"} py-1 px-10 md:py-3 md:px-8 transition-all duration-1400`}>
          <NavLink className="site-brand inline-flex items-center gap-3 text-sm font-semibold no-underline" to="/" aria-label={copy.navigation.homeLabel}>
            <img alt="" aria-hidden="true" className="site-brand__mark size-8" src="/global/matteo-vittori-mark-reverse.svg" />
            <span>Matteo Vittori</span>
          </NavLink>

          <nav className="desktop-navigation hidden items-center gap-[clamp(1.4rem,3vw,2.6rem)] md:flex" aria-label={copy.navigation.primaryLabel}>
            {primaryNavigation.map(([label, href]) => (
              <NavLink className={({ isActive }) => `${desktopLinkClass}${isActive ? " after:origin-left after:scale-x-100" : ""}`} key={href} to={href}>
                {label}
              </NavLink>
            ))}
            <a className={desktopLinkClass} href="/documents/matteo-vittori-cv.pdf">
              CV <ArrowMark />
            </a>
            <button
              aria-label={copy.navigation.changeLanguage}
              className="rounded-md bg-(--color-accent) px-2 py-1 text-[0.72rem] font-semibold tracking-[0.08em]"
              onClick={() => setLanguage(language === "en" ? "it" : "en")}
              type="button"
            >
              {language === "en" ? "IT" : "EN"}
            </button>
          </nav>

          <button
            aria-controls="mobile-navigation"
            aria-expanded={isOpen}
            aria-label={copy.navigation.menu}
            className="mobile-menu-button grid size-10 place-items-center rounded-xl border-0 bg-transparent text-lg md:hidden"
            onClick={() => setIsOpen(true)}
            ref={menuButtonRef}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faBars} />
          </button>
        </div>
      </header>

      {createPortal(<div
        aria-hidden={!isOpen}
        className={`mobile-navigation${isOpen ? " is-open" : ""}`}
        id="mobile-navigation"
        ref={navigationRef}
      >
        <div className="mobile-navigation__top page-shell">
          <span className="site-brand inline-flex items-center gap-3 text-sm font-semibold">
            <img alt="" aria-hidden="true" className="site-brand__mark size-8" src="/global/matteo-vittori-mark-reverse.svg" />
            <span>Matteo Vittori</span>
          </span>
          <button aria-label={copy.navigation.close} className="grid size-10 place-items-center text-lg" ref={closeButtonRef} onClick={closeMenu} tabIndex={isOpen ? 0 : -1} type="button">
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </button>
        </div>
        <nav aria-label={copy.navigation.mobileLabel}>
          {primaryNavigation.map(([label, href], index) => (
            <NavLink key={href} onClick={() => setIsOpen(false)} tabIndex={isOpen ? 0 : -1} to={href}>
              <span>0{index + 1}</span>{label}
            </NavLink>
          ))}
          <a href="/documents/matteo-vittori-cv.pdf" tabIndex={isOpen ? 0 : -1}>
            <span>05</span>CV <ArrowMark />
          </a>
        </nav>
        <div className="mobile-navigation__contact page-shell">
          <a aria-label={copy.navigation.emailLabel} href="mailto:matteo01.vittori@icloud.com" tabIndex={isOpen ? 0 : -1}><FontAwesomeIcon aria-hidden="true" icon={faEnvelope} /></a>
          <a aria-label={copy.navigation.githubLabel} href="https://github.com/matte67" rel="noreferrer" tabIndex={isOpen ? 0 : -1} target="_blank"><FontAwesomeIcon aria-hidden="true" icon={faGithub} /></a>
          <button
            className="ml-auto rounded-md bg-(--color-accent) px-3 py-2 font-mono text-xs tracking-[0.12em]"
            onClick={() => { setLanguage(language === "en" ? "it" : "en"); setIsOpen(false); }}
            tabIndex={isOpen ? 0 : -1}
            type="button"
          >
            {language === "en" ? "ITALIANO" : "ENGLISH"}
          </button>
        </div>
      </div>, document.body)}
    </>
  );
}
