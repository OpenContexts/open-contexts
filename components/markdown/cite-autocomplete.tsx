"use client";

import { createContext, type ReactNode, type RefObject, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { type Citable, citables } from "@/lib/references";
import type { CitableReferences } from "./markdown";

const CitationsContext = createContext<CitableReferences | null>(null);

/** The references that the markdown editors inside can cite with \cite{key}, and show in their preview. */
export function CitationsProvider({ references, children }: { references: CitableReferences; children: ReactNode }) {
  return <CitationsContext value={references}>{children}</CitationsContext>;
}

/** The references of the surrounding CitationsProvider, or null outside of one (then \cite is not offered). */
export const useCitations = () => useContext(CitationsContext);

/** The citation being typed: `\cite{erd|` or `\cite{a, erd|`, with the range of the key to replace. */
type Typing = { start: number; end: number; query: string };

function typingAt(el: HTMLTextAreaElement): Typing | null {
  if (el.selectionStart !== el.selectionEnd) return null;
  const caret = el.selectionStart;
  const inside = el.value.slice(Math.max(0, caret - 300), caret).match(/\\cite\{([^{}\n]*)$/)?.[1];
  if (inside === undefined) return null;
  const typed = inside.slice(inside.lastIndexOf(",") + 1);
  // The rest of the key, when the caret is inside one.
  const rest = el.value.slice(caret).match(/^[^\s,{}]*/)?.[0] ?? "";
  return { start: caret - typed.trimStart().length, end: caret + rest.length, query: typed.trim() };
}

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

/** Every word of the query in the key or the citation, or the query is the number; keys starting with it first. */
function matches(all: Citable[], query: string): Citable[] {
  const q = fold(query);
  const words = q.split(/\s+/).filter(Boolean);
  if (!words.length) return all;
  const found = all.filter((c) => String(c.n) === q || words.every((w) => fold(`${c.key} ${c.text}`).includes(w)));
  return found.toSorted((a, b) => Number(!fold(a.key).startsWith(q)) - Number(!fold(b.key).startsWith(q)));
}

// The styles a mirror of the textarea needs to lay out its text the same way.
const MIRRORED = [
  "box-sizing", "width", "border-top-width", "border-right-width", "border-bottom-width", "border-left-width",
  "padding-top", "padding-right", "padding-bottom", "padding-left", "font-family", "font-size", "font-weight",
  "font-style", "font-variant", "font-stretch", "line-height", "letter-spacing", "word-spacing", "tab-size",
  "text-indent", "text-transform", "text-align", "direction",
];

/** Where in the textarea the character at `pos` is, from its top left corner, measured on a hidden copy of the text. */
function caretPosition(el: HTMLTextAreaElement, pos: number): { top: number; left: number; height: number } {
  const style = getComputedStyle(el);
  const mirror = document.createElement("div");
  for (const p of MIRRORED) mirror.style.setProperty(p, style.getPropertyValue(p));
  Object.assign(mirror.style, { position: "absolute", top: "0", left: "-9999px", visibility: "hidden", whiteSpace: "pre-wrap", overflowWrap: "break-word", overflow: "hidden" });
  mirror.textContent = el.value.slice(0, pos);
  const marker = document.createElement("span");
  marker.textContent = el.value.slice(pos) || ".";
  mirror.append(marker);
  document.body.append(mirror);
  const result = {
    top: marker.offsetTop - el.scrollTop,
    left: marker.offsetLeft - el.scrollLeft,
    height: parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4,
  };
  mirror.remove();
  return result;
}

/** Replaces the selection, keeping the browser's undo history where it can. */
function insert(el: HTMLTextAreaElement, text: string) {
  el.focus();
  if (!document.execCommand("insertText", false, text)) {
    el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

/**
 * Typing \cite{ in the textarea opens a list of the references; typing on filters it (by key, author, title,
 * year or number). Arrow keys and Enter or Tab choose one, Escape closes the list. Render it next to the
 * textarea, inside a `relative` box that holds both.
 */
export function CiteAutocomplete({ textarea, references, admin }: { textarea: RefObject<HTMLTextAreaElement | null>; references: CitableReferences; admin?: boolean }) {
  const listId = useId();
  const all = useMemo(() => citables(references), [references]);
  const [typing, setTyping] = useState<Typing | null>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [active, setActive] = useState(0);
  // Escape closes the list until the caret leaves this citation.
  const dismissed = useRef<number | null>(null);
  const options = useMemo(() => (typing ? matches(all, typing.query) : []), [all, typing]);
  const open = typing !== null;

  // Read by the listeners below, which are attached once.
  const state = useRef({ typing, options, active });
  useEffect(() => {
    state.current = { typing, options, active };
  });

  const choose = (c: Citable) => {
    const el = textarea.current;
    const t = state.current.typing;
    if (!el || !t) return;
    el.setSelectionRange(t.start, t.end);
    const closed = /^\s*[,}]/.test(el.value.slice(t.end));
    insert(el, closed ? c.key : `${c.key}}`);
    // Past the closing brace, so typing goes on after the citation.
    if (closed && el.value[el.selectionEnd] === "}") el.setSelectionRange(el.selectionEnd + 1, el.selectionEnd + 1);
    setTyping(null);
  };
  const chooseRef = useRef(choose);
  useEffect(() => {
    chooseRef.current = choose;
  });

  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    const update = () => {
      const t = document.activeElement === el ? typingAt(el) : null;
      if (!t || dismissed.current === t.start) {
        if (!t) dismissed.current = null;
        setTyping(null);
        return;
      }
      const caret = caretPosition(el, t.start);
      // Below the line with the citation, within the textarea even when that line is scrolled out of view.
      // The list is at most 20rem wide and kept within the textarea's width.
      const width = Math.min(320, el.offsetWidth);
      setPosition({ top: el.offsetTop + Math.min(Math.max(caret.top + caret.height, 0), el.offsetHeight) + 2, left: el.offsetLeft + Math.max(0, Math.min(caret.left, el.offsetWidth - width)) });
      setTyping((prev) => (prev?.start === t.start && prev.query === t.query && prev.end === t.end ? prev : t));
      setActive((a) => (state.current.typing?.start === t.start && state.current.typing.query === t.query ? a : 0));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const { typing: t, options: o, active: a } = state.current;
      if (!t || e.isComposing) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (o.length) setActive((a + (e.key === "ArrowDown" ? 1 : o.length - 1)) % o.length);
      } else if ((e.key === "Enter" || e.key === "Tab") && o[a]) {
        e.preventDefault();
        chooseRef.current(o[a]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        dismissed.current = t.start;
        setTyping(null);
      }
    };
    const close = () => setTyping(null);
    // Arrow keys move the caret after keydown, hence keyup; `select` covers clicks and selections.
    const onKeyUp = (e: KeyboardEvent) => ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key) && update();
    el.addEventListener("input", update);
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("keyup", onKeyUp);
    el.addEventListener("click", update);
    el.addEventListener("blur", close);
    el.addEventListener("scroll", update);
    return () => {
      el.removeEventListener("input", update);
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("keyup", onKeyUp);
      el.removeEventListener("click", update);
      el.removeEventListener("blur", close);
      el.removeEventListener("scroll", update);
    };
  }, [textarea]);

  // Tells assistive technology about the list, and keeps the active option in view.
  useEffect(() => {
    const el = textarea.current;
    if (!el) return;
    el.setAttribute("aria-autocomplete", "list");
    el.setAttribute("aria-expanded", String(open));
    if (open) el.setAttribute("aria-controls", listId);
    else el.removeAttribute("aria-controls");
    if (open && options[active]) el.setAttribute("aria-activedescendant", `${listId}-${active}`);
    else el.removeAttribute("aria-activedescendant");
    if (open) document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [textarea, open, options, active, listId]);

  if (!open) return null;
  return (
    <div
      style={position}
      // Keeps the focus in the textarea when the list is clicked.
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        "absolute z-30 w-80 max-w-full overflow-hidden text-left shadow-lg",
        admin ? "rounded-md bg-white text-sm ring-1 ring-zinc-200" : "rounded-sm border border-rule-strong bg-paper font-serif text-[0.95rem]",
      )}
    >
      <p className={cn("border-b px-3 py-1.5 font-sans text-xs", admin ? "border-zinc-100 text-zinc-500" : "border-rule text-ink-subtle")}>
        {all.length === 0
          ? "No references to cite yet."
          : options.length === 0
            ? `No reference matches “${typing.query}”.`
            : "Cite a reference · ↑↓ to move, Enter to choose"}
      </p>
      {options.length > 0 && (
        <ul id={listId} role="listbox" aria-label="References" className="max-h-64 overflow-y-auto py-1">
          {options.map((c, i) => (
            <li
              key={c.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(c)}
              className={cn("flex cursor-pointer gap-2.5 px-3 py-1.5", i === active && (admin ? "bg-zinc-100" : "bg-surface"))}
            >
              <span className={cn("w-6 flex-none text-right tabular-nums", admin ? "text-zinc-400" : "text-ink-subtle")}>[{c.n}]</span>
              <span className="min-w-0">
                <span className={cn("block font-mono text-xs", admin ? "text-zinc-900" : "text-brand")}>{c.key}</span>
                <span className={cn("line-clamp-2 block leading-snug", admin ? "text-zinc-600" : "text-ink-muted")}>{c.text}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
