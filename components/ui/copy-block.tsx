"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export type CopyState = "idle" | "copied" | "failed";

/** Puts text on the clipboard. False where the browser refuses (no permission, or not a secure page). */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Text to copy, such as a citation: a labelled panel with the text in a monospaced block and a Copy button.
 * When copying fails, the text is selected instead, ready for Cmd/Ctrl+C. `initial` reports a copy that was
 * already made when the block opened.
 */
export function CopyBlock({ label, text, initial = "idle", actions, className }: { label: string; text: string; initial?: CopyState; actions?: ReactNode; className?: string }) {
  const [state, setState] = useState(initial);
  const pre = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (state !== "failed" || !pre.current) return;
    getSelection()?.selectAllChildren(pre.current);
  }, [state]);

  return (
    <div className={cn("rounded border border-rule bg-surface", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-rule py-1.5 pr-1.5 pl-3.5 font-sans text-xs">
        <span className="font-bold tracking-[0.12em] text-ink-subtle uppercase">{label}</span>
        <span role="status" className={cn("ml-auto", state === "copied" ? "text-success" : "text-ink-muted")}>
          {state === "copied" ? "Copied to clipboard" : state === "failed" ? "Couldn’t copy. The text is selected: press Ctrl+C or ⌘C." : ""}
        </span>
        <Button variant="ghost" size="sm" onClick={async () => setState((await copyText(text)) ? "copied" : "failed")}>
          Copy
        </Button>
        {actions}
      </div>
      <pre ref={pre} className="overflow-x-auto px-4 py-3 font-mono text-[0.82rem]/relaxed whitespace-pre text-ink">
        {text}
      </pre>
    </div>
  );
}
