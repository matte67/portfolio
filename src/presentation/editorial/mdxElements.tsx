import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

function joinClassNames(...classNames: readonly (string | undefined)[]) {
  return classNames.filter(Boolean).join(" ");
}

/** Consistent lazy media treatment for plain Markdown images. */
export function EditorialImage({ className, loading, ...props }: ComponentPropsWithoutRef<"img">) {
  return (
    <img
      {...props}
      className={joinClassNames("editorial-inline-image", className)}
      decoding="async"
      loading={loading ?? "lazy"}
    />
  );
}

/** Consistent code surface for fenced blocks authored directly in MDX. */
export function EditorialPre({ children, className, ...props }: PropsWithChildren<ComponentPropsWithoutRef<"pre">>) {
  return (
    <pre {...props} className={joinClassNames("editorial-code", className)}>
      {children}
    </pre>
  );
}
