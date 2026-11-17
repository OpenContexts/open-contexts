"use client";

import { Fragment, type PointerEvent, type RefObject, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { type Citable, displayUrl } from "@/lib/references";
import { CitationText } from "./citation-text";

/**
 * A \cite{…} in the text: "[1, 3]". Each number shows its reference in a card on hover, focus or tap; a click
 * opens the reference's link. Keys without a reference show as "?", so a mistake is visible in the preview.
 */
export function Citation({ items }: { items: (Citable | { key: string; missing: true })[] }) {
  return (
    <span className="whitespace-nowrap">
      [
      {items.map((c, i) => (
        <Fragment key={i}>
          {i > 0 && ", "}
          {"missing" in c ? (
            <span title={`No reference with the key “${c.key}”`} className="text-brand">
              ?
            </span>
          ) : (
            <CiteMark citation={c} />
          )}
        </Fragment>
      ))}
      ]
    </span>
  );
}

function CiteMark({ citation: c }: { citation: Citable }) {
  const id = useId();
  const trigger = useRef<HTMLElement>(null);
  const card = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number }>();
  const closing = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pointer = useRef("mouse");
  // Whether the card was open before this tap: a tap focuses the number, which opens the card before the click.
  const wasOpen = useRef(false);

  const show = () => {
    clearTimeout(closing.current);
    setOpen(true);
  };
  // A short delay, so the pointer can move from the number into the card.
  const hide = () => {
    clearTimeout(closing.current);
    closing.current = setTimeout(() => setOpen(false), 150);
  };
  // Hover is for the mouse; touch screens open the card with a tap instead.
  const enter = (e: PointerEvent) => e.pointerType === "mouse" && show();
  const leave = (e: PointerEvent) => e.pointerType === "mouse" && hide();

  // The card is placed in the viewport (it is rendered into <body>, so clipped containers don't cut it off):
  // below the number, or above it when there is no room below, and never past the sides of the screen.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const t = trigger.current?.getBoundingClientRect();
      const el = card.current;
      if (!t || !el) return;
      const margin = 8;
      const left = Math.min(Math.max(margin, t.left + t.width / 2 - el.offsetWidth / 2), window.innerWidth - el.offsetWidth - margin);
      const below = t.bottom + 6;
      const top = below + el.offsetHeight > window.innerHeight - margin && t.top - el.offsetHeight - 6 > margin ? t.top - el.offsetHeight - 6 : below;
      setPosition({ top, left });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open]);

  // A tap elsewhere closes it; so does Escape.
  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => {
      const target = e.target as Node;
      if (!trigger.current?.contains(target) && !card.current?.contains(target)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  useEffect(() => () => clearTimeout(closing.current), []);

  const props = {
    "aria-describedby": open ? id : undefined,
    onPointerDown: (e: PointerEvent) => {
      pointer.current = e.pointerType;
      wasOpen.current = open;
    },
    onPointerEnter: enter,
    onPointerLeave: leave,
    onFocus: show,
    onBlur: hide,
    className: "cursor-pointer text-brand no-underline hover:underline",
  };

  return (
    <>
      {c.url ? (
        <a
          ref={trigger as RefObject<HTMLAnchorElement>}
          href={c.url}
          target="_blank"
          rel="noopener noreferrer"
          // On a touch screen the first tap shows the card; its link opens the reference.
          onClick={(e) => {
            if (pointer.current !== "mouse" && !wasOpen.current) {
              e.preventDefault();
              show();
            }
          }}
          {...props}
        >
          {c.n}
        </a>
      ) : (
        <button ref={trigger as RefObject<HTMLButtonElement>} type="button" onClick={() => (pointer.current !== "mouse" && wasOpen.current ? setOpen(false) : show())} {...props}>
          {c.n}
        </button>
      )}
      {open &&
        createPortal(
          <span
            ref={card}
            id={id}
            role="tooltip"
            onPointerEnter={enter}
            onPointerLeave={leave}
            onFocus={show}
            onBlur={hide}
            style={position ?? { top: 0, left: 0, visibility: "hidden" }}
            className="fixed z-50 block w-80 max-w-[calc(100vw-1rem)] rounded border border-rule-strong bg-paper px-3.5 py-3 text-left font-serif text-[0.95rem]/snug whitespace-normal text-ink not-italic shadow-lg"
          >
            <span className="block font-sans text-[0.68rem] font-bold tracking-[0.12em] text-ink-subtle uppercase">Reference [{c.n}]</span>
            <span className="mt-1 block">
              <CitationText text={c.text} url={c.url} append={false} newTab />
            </span>
            {c.url && (
              <a href={c.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 block truncate font-sans text-xs text-brand hover:underline">
                ↗ {displayUrl(c.url)}
              </a>
            )}
          </span>,
          document.body,
        )}
    </>
  );
}
