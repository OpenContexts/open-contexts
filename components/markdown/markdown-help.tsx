"use client";

import { type PointerEvent, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { FormattingGuide } from "./formatting-guide";

/** The (i) icon. */
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn("size-3.5 flex-none", className)}>
      <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="4.9" r="0.95" fill="currentColor" />
      <path d="M8 7.2v4.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The hint above a markdown editor ("Markdown · math with $…$ …") with an (i) button that opens a summary of the
 * formatting. On wide screens it is a panel by the button: hovering shows it, a click keeps it open until a click
 * elsewhere or Escape. On phones the hint shrinks to "Formatting", and the summary fills the screen, with a close
 * button. `cite`: the editor can cite references, so citations are explained too. `admin`: the dashboard's colours.
 */
export function MarkdownHelp({ cite, admin }: { cite?: boolean; admin?: boolean }) {
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  // "hover" closes when the pointer leaves; "pinned" (a click or tap) stays until dismissed.
  const [open, setOpen] = useState<false | "hover" | "pinned">(false);
  const [phone, setPhone] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; maxHeight: number }>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const later = (fn: () => void, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };
  const dismiss = (refocus = false) => {
    clearTimeout(timer.current);
    setOpen(false);
    if (refocus) button.current?.focus();
  };

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px)");
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  // On wide screens: below the button, right-aligned with it, within the window; scrolls inside when long.
  useLayoutEffect(() => {
    if (!open || phone) return;
    const place = () => {
      const b = button.current?.getBoundingClientRect();
      const el = panel.current;
      if (!b || !el) return;
      const margin = 8;
      const left = Math.min(Math.max(margin, b.right - el.offsetWidth), window.innerWidth - el.offsetWidth - margin);
      const below = window.innerHeight - b.bottom - 6 - margin;
      const above = b.top - 6 - margin;
      // Above the button only when that leaves clearly more room than below.
      if (below < 320 && above > below) {
        const maxHeight = Math.min(above, el.scrollHeight);
        setPosition({ top: b.top - 6 - maxHeight, left, maxHeight });
      } else setPosition({ top: b.bottom + 6, left, maxHeight: below });
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, phone]);

  // A click elsewhere or Escape closes it; on phones the page behind does not scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => {
      const target = e.target as Node;
      // Citation cards of the examples are rendered into <body>, outside the panel.
      if (button.current?.contains(target) || panel.current?.contains(target) || (target as Element).closest?.("[role=tooltip]")) return;
      dismiss();
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      dismiss(true);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    const overflow = document.documentElement.style.overflow;
    if (phone) document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      document.documentElement.style.overflow = overflow;
    };
  }, [open, phone]);

  // Opened with a click or tap: the focus moves into it, so the keyboard and screen readers follow.
  useEffect(() => {
    if (open === "pinned") (phone ? close.current : panel.current)?.focus({ preventScroll: true });
  }, [open, phone]);

  const hover = {
    onPointerEnter: (e: PointerEvent) => e.pointerType === "mouse" && open !== "pinned" && later(() => setOpen((o) => o || "hover"), open ? 0 : 200),
    onPointerLeave: (e: PointerEvent) => e.pointerType === "mouse" && open !== "pinned" && later(() => setOpen((o) => (o === "hover" ? false : o)), 200),
  };

  const hint = admin ? "text-zinc-400" : "text-ink-subtle";

  return (
    <>
      <span className={cn("ml-auto flex min-w-0 items-center gap-1.5 text-right text-xs", hint)}>
        <span className="max-sm:hidden">
          Markdown · math with $…$ and $$…$${cite && <> · cite with \cite{"{…}"}</>}
        </span>
        <button
          ref={button}
          type="button"
          onClick={() => {
            if (open === "pinned") return dismiss();
            clearTimeout(timer.current);
            setOpen("pinned");
          }}
          aria-expanded={!!open}
          aria-controls={open ? id : undefined}
          aria-label="Formatting help"
          {...hover}
          className={cn(
            "-m-1 inline-flex cursor-pointer items-center gap-1 rounded p-1",
            admin ? "hover:text-zinc-900" : "hover:text-ink",
            open && (admin ? "text-zinc-900" : "text-ink"),
          )}
        >
          <InfoIcon />
          <span className="sm:hidden">Formatting</span>
        </button>
      </span>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            role="dialog"
            aria-modal={phone || undefined}
            aria-labelledby={`${id}-title`}
            tabIndex={-1}
            {...hover}
            style={phone ? undefined : position ? { top: position.top, left: position.left, maxHeight: position.maxHeight } : { top: 0, left: 0, visibility: "hidden" }}
            className={cn(
              "fixed z-40 overflow-y-auto overscroll-contain bg-paper text-left font-serif text-[0.95rem]/snug text-ink outline-none",
              phone ? "inset-0 px-5 pb-8" : "w-[34rem] max-w-[calc(100vw-1rem)] rounded border border-rule-strong px-5 pb-5 shadow-xl",
            )}
          >
            <div className={cn("sticky top-0 z-10 -mx-5 flex items-center justify-between gap-4 border-b border-rule bg-paper px-5", phone ? "py-3" : "py-2.5")}>
              <h2 id={`${id}-title`} className="font-sans text-sm font-bold">
                Formatting
              </h2>
              {(phone || open === "pinned") && (
                <button
                  ref={close}
                  type="button"
                  onClick={() => dismiss(true)}
                  aria-label="Close"
                  className={cn("-mr-2 flex cursor-pointer items-center justify-center rounded text-ink-subtle hover:text-ink", phone ? "size-10 text-2xl" : "size-7 text-lg")}
                >
                  ×
                </button>
              )}
            </div>
            <p className="mt-3 text-[0.9rem] text-ink-muted">Text is written in Markdown, with LaTeX for math. Use the Preview tab to check how it will look.</p>
            <div className="mt-8">
              <FormattingGuide cite={cite} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
