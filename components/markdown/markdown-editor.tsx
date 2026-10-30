"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { MarkdownContent } from "./markdown";

/**
 * A textarea with a Write / Preview toggle that renders markdown and LaTeX exactly as the
 * site will. The textarea stays uncontrolled, so React's form reset and `defaultValue` work.
 */
export function MarkdownEditor({
  id,
  name,
  defaultValue = "",
  rows = 8,
  placeholder,
  invalid,
  describedBy,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [value, setValue] = useState(defaultValue);
  const tab = (m: typeof mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className={cn(
        "cursor-pointer border-b-2 px-1 pb-0.5 font-sans text-xs font-bold",
        mode === m ? "border-brand text-ink" : "border-transparent text-ink-subtle hover:text-ink",
      )}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-3">
        {tab("write", "Write")}
        {tab("preview", "Preview")}
        <span className="ml-auto text-xs text-ink-subtle">Markdown · math with $…$ and $$…$$</span>
      </div>
      <Textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onInput={(e) => setValue(e.currentTarget.value)}
        className={cn(mode === "preview" && "hidden")}
      />
      {mode === "preview" && (
        <div className="min-h-32 rounded-sm border border-dashed border-rule-strong px-4 py-3">
          {value.trim() ? <MarkdownContent source={value} untrusted /> : <p className="text-ink-subtle">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
