interface FooterMergeCornerProps {
  readonly side: "left" | "right";
}

/** SVG raccord that lets the dark footer grow naturally out of the fixed frame. */
export function FooterMergeCorner({ side }: FooterMergeCornerProps) {
  return (
    <svg
      aria-hidden="true"
      className={`site-footer__merge-corner site-footer__merge-corner--${side}`}
      focusable="false"
      viewBox="0 0 64 64"
    >
      <path d="M0 0v64h64C28.65 64 0 35.35 0 0Z" fill="currentColor" />
    </svg>
  );
}
