import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faArrowUpRightFromSquare,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

interface SmartLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  readonly href: string;
  readonly children: ReactNode;
}

export function ArrowMark() {
  return <FontAwesomeIcon aria-hidden="true" icon={faArrowUpRightFromSquare} />;
}

export function DownMark() {
  return <FontAwesomeIcon aria-hidden="true" icon={faArrowDown} />;
}

export function DownloadMark() {
  return <FontAwesomeIcon aria-hidden="true" icon={faDownload} />;
}

export function PreviousMark() {
  return <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />;
}

export function NextMark() {
  return <FontAwesomeIcon aria-hidden="true" icon={faArrowRight} />;
}

/** Uses client navigation for routes and a normal anchor for documents or external URLs. */
export function SmartLink({ href, children, ...props }: SmartLinkProps) {
  const isRoute = href.startsWith("/") && !href.endsWith(".pdf");

  if (isRoute) {
    return (
      <Link to={href} className={props.className} aria-label={props["aria-label"]}>
        {children}
      </Link>
    );
  }

  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      {...props}
      target={isExternal ? "_blank" : props.target}
      rel={isExternal ? "noreferrer" : props.rel}
    >
      {children}
    </a>
  );
}
