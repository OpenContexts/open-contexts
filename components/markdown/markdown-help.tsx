"use client";

import { type PointerEvent, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { MarkdownContent } from "./markdown";

/** Made-up references for the citation examples. */
const EXAMPLE_REFERENCES = [
  { key: "smith2024", text: "J. Smith, An example paper, J. Examples 1, 1 (2024)", url: "https://arxiv.org/" },
  { key: "lee2025", text: "K. Lee, Another example (2025)" },
];

type Row = { type: string; get: ReactNode };

/** What is typed, and what it looks like: rendered by the site's own renderer, so the two cannot drift apart. */
const rendered = (source: string) => <MarkdownContent source={source} references={EXAMPLE_REFERENCES} className="[&_ol]:mb-0 [&_ul]:mb-0 [&>*]:mb-0" />;

const SECTIONS: { title: string; rows: Row[]; cite?: boolean }[] = [
  {
    title: "Text",
    rows: [
      { type: "*italic*", get: rendered("*italic*") },
      { type: "**bold**", get: rendered("**bold**") },
      { type: "`code`", get: rendered("`code`") },
      { type: "[a link](https://arxiv.org)", get: rendered("[a link](https://arxiv.org)") },
    ],
  },
  {
    title: "Structure",
    rows: [
      { type: "## Background", get: "A section heading; on a problem page, sections are lettered A., B., …" },
      { type: "### Special cases", get: "A subsection heading" },
      { type: "> A quotation", get: rendered("> A quotation") },
    ],
  },
  {
    title: "Math (LaTeX)",
    rows: [
      { type: "$\\rho \\otimes \\sigma$", get: rendered("$\\rho \\otimes \\sigma$") },
      { type: "$$\n\\int_0^1 f(x)\\,\\mathrm{d}x\n$$", get: rendered("$$\n\\int_0^1 f(x)\\,\\mathrm{d}x\n$$") },
      { type: "\\$5", get: "A dollar sign that is not math: $5" },
    ],
  },
  {
    title: "Citations",
    cite: true,
    rows: [
      { type: "\\cite{smith2024}", get: rendered("\\cite{smith2024}") },
      { type: "\\cite{smith2024, lee2025}", get: rendered("\\cite{smith2024, lee2025}") },
    ],
  },
];

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

  const sections = SECTIONS.filter((s) => cite || !s.cite);
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
            {sections.map((s) => (
              <section key={s.title} className="mt-8">
                <h3 className="mb-1.5 font-sans text-[0.7rem] font-bold tracking-[0.12em] text-ink-subtle uppercase">{s.title}</h3>
                <dl className="divide-y divide-rule border-y border-rule">
                  {s.rows.map((r) => (
                    <div key={r.type} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-4 py-1">
                      <dt>
                        <code className="font-mono text-[0.8rem] wrap-break-words whitespace-pre-wrap text-ink">{r.type}</code>
                      </dt>
                      <dd className="min-w-0 text-[0.92rem]">{r.get}</dd>
                    </div>
                  ))}
                </dl>
                {s.cite && (
                  <p className="mt-1.5 text-[0.88rem] text-ink-muted">
                    Type <code className="font-mono text-[0.8rem]">\cite{"{"}</code> to choose from the references; the list filters as you type. Citations show as
                    numbers, and each number shows its reference on hover.
                  </p>
                )}
              </section>
            ))}
            <p className="mt-4 text-[0.88rem] text-ink-muted">
              HTML is not supported. All math commands:{" "}
              <a href="https://katex.org/docs/supported.html" target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                KaTeX&apos;s list of supported functions
              </a>
              .
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
