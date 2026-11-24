import { useId, useLayoutEffect, useRef, useState } from "react";

interface FilterWheelProps {
  label: string;
  options: readonly string[];
  all: string;
  value: string;
  onChange: (value: string) => void;
}

/** Scroll snapping keeps one option centred for touch, wheel and keyboard users. */
export function FilterWheel({ label, options, all, value, onChange }: FilterWheelProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const list = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const values = ["", ...options];
  const index = Math.max(0, values.indexOf(value));
  const initialIndex = useRef(index);
  const lastIndex = useRef(index);

  useLayoutEffect(() => {
    if (!open || !list.current) return;
    const row = list.current.firstElementChild as HTMLElement;
    list.current.scrollTop = initialIndex.current * row.offsetHeight;
    list.current.focus({ preventScroll: true });
  }, [open]);

  function choose(next: number) {
    const target = Math.min(values.length - 1, Math.max(0, next));
    const row = list.current?.children[target] as HTMLElement | undefined;
    if (list.current && row) list.current.scrollTop = row.offsetHeight * target;
  }

  return <div className="filter-wheel">
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={id} onClick={() => {
      initialIndex.current = index;
      lastIndex.current = index;
      setOpen(!open);
    }}>{label}<strong>{value || all} ▾</strong></button>
    {open && <div ref={list} id={id} className="filter-wheel__list" role="listbox" tabIndex={0}
      aria-label={label} aria-activedescendant={id + "-" + index}
      onKeyDown={(event) => {
        const targets: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: values.length - 1 };
        if (event.key in targets) {
          event.preventDefault();
          choose(targets[event.key]);
        } else if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
      onScroll={({ currentTarget }) => {
        const height = (currentTarget.firstElementChild as HTMLElement).offsetHeight;
        const next = Math.max(0, Math.min(values.length - 1, Math.round(currentTarget.scrollTop / height)));
        if (next === lastIndex.current) return;
        lastIndex.current = next;
        navigator.vibrate?.(8);
        onChange(values[next]);
      }}>
      {values.map((option, position) => <div role="option" key={option} id={id + "-" + position}
        aria-selected={index === position} onClick={() => choose(position)}
        style={{ transform: `perspective(240px) rotateX(${Math.max(-2, Math.min(2, position - index)) * -22}deg)` }}>
        {option || all}
      </div>)}
    </div>}
  </div>;
}
