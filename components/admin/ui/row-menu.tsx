"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type Common = { label: string; danger?: boolean; /** Draws a line above the item. */ separated?: boolean };
/** Either an action (opens a dialog, …) or a link. `disabled` is the reason, shown as a tooltip. */
export type RowMenuItem =
  | (Common & { onSelect: () => void; disabled?: string })
  | (Common & { href: string; external?: boolean; download?: boolean | string });

/**
 * A small dropdown in the browser's top layer (popover), so the table's scroll container cannot
 * clip it. It is placed under its button when opened and closes on outside click, Escape or scroll.
 */
export function RowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const hide = () => menu.current?.hidePopover();
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [open]);

  function toggle() {
    const el = menu.current;
    const rect = button.current?.getBoundingClientRect();
    if (!el || !rect) return;
    if (open) return el.hidePopover();
    el.style.right = `${window.innerWidth - rect.right}px`;
    el.showPopover();
    // Below the button, or above it if there is not enough room.
    const above = rect.bottom + 4 + el.offsetHeight > window.innerHeight;
    el.style.top = `${above ? rect.top - 4 - el.offsetHeight : rect.bottom + 4}px`;
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        // A click on the button while open would first light-dismiss the popover and then reopen it.
        onPointerDown={(e) => open && e.preventDefault()}
        onClick={toggle}
        className={cn("inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900", open && "bg-zinc-100 text-zinc-900")}
      >
        <svg viewBox="0 0 16 16" aria-hidden className="size-4 fill-current">
          <circle cx="8" cy="3" r="1.5" />
          <circle cx="8" cy="8" r="1.5" />
          <circle cx="8" cy="13" r="1.5" />
        </svg>
      </button>
      <div
        ref={menu}
        popover="auto"
        role="menu"
        onToggle={(e) => setOpen(e.newState === "open")}
        className="fixed inset-auto m-0 w-48 rounded-md bg-white py-1 font-ui text-sm text-zinc-900 shadow-lg ring-1 ring-zinc-200"
      >
        {items.map((item) => {
          const className = cn(
            "block w-full cursor-pointer px-3 py-1.5 text-left transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
            item.danger && "text-red-600",
            item.separated && "mt-1 border-t border-zinc-100 pt-2",
          );
          const close = () => menu.current?.hidePopover();
          return "href" in item ? (
            <a key={item.label} role="menuitem" href={item.href} target={item.external ? "_blank" : undefined} download={item.download} onClick={close} className={className}>
              {item.label}
            </a>
          ) : (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={!!item.disabled}
              title={item.disabled}
              onClick={() => {
                close();
                item.onSelect();
              }}
              className={className}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
