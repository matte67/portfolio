/** Single SVG silhouette for the header and both concave frame raccords. */
export function HeaderMergeSurface() {
  return (
    <svg
      aria-hidden="true"
      className="site-header__merge-surface"
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 1000 100"
    >
      <path
        d="M0 0H1000C1000 55 973 100 940 100H60C27 100 0 55 0 0Z"
        fill="currentColor"
      />
    </svg>
  );
}
