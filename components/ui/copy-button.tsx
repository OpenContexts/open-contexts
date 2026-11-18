"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { type CopyState, copyText } from "./copy-block";
import { CheckIcon, CopyIcon } from "./icons";

/** A small icon button that puts `text` on the clipboard, and says for a moment that it did. `label`: what it copies. */
export function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
  const [state, setState] = useState<CopyState>("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <span className={cn("relative inline-flex align-middle", className)}>
      <button
        type="button"
        onClick={async () => setState((await copyText(text)) ? "copied" : "failed")}
        aria-label={`Copy ${label}`}
        title={`Copy ${label}`}
        className={cn("inline-flex size-6 cursor-pointer items-center justify-center rounded transition hover:bg-surface", state === "copied" ? "text-success" : "text-ink-subtle hover:text-ink")}
      >
        {state === "copied" ? <CheckIcon /> : <CopyIcon />}
      </button>
      <span role="status" className="pointer-events-none absolute top-1/2 left-full ml-1 -translate-y-1/2 font-sans text-xs whitespace-nowrap">
        {state === "copied" ? <span className="text-success">Copied</span> : state === "failed" ? <span className="text-brand">Couldn’t copy</span> : null}
      </span>
    </span>
  );
}
