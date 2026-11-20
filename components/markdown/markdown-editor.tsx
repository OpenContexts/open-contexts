"use client";

import { useRef, useState } from "react";
import { Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import { CiteAutocomplete, useCitations } from "./cite-autocomplete";
import { MarkdownContent } from "./markdown";
import { MarkdownHelp } from "./markdown-help";

/**
 * A textarea with a Write / Preview toggle that renders markdown and LaTeX exactly as the
 * site will. The textarea stays uncontrolled, so React's form reset and `defaultValue` work.
 * Inside a CitationsProvider, typing \cite{ offers the references to cite. `maxLength`: the most characters the
 * server accepts, counted in the corner as one types. Not enforced here, so a pasted text that is too long is not cut
 * off unseen; the counter turns red instead.
 */
export function MarkdownEditor({
  id,
  name,
  defaultValue = "",
  rows = 8,
  placeholder,
  invalid,
  describedBy,
  autoFocus,
  maxLength,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [value, setValue] = useState(defaultValue);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const references = useCitations();
  // As the server counts: without the spaces and blank lines around the text.
  const length = value.trim().length;
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
        <MarkdownHelp cite={!!references} />
      </div>
      <div className="relative">
        <Textarea
          ref={textarea}
          id={id}
          name={name}
          rows={rows}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={[describedBy, maxLength && `${id}-count`].filter(Boolean).join(" ") || undefined}
          autoFocus={autoFocus}
          onInput={(e) => setValue(e.currentTarget.value)}
          className={cn(maxLength && "pb-6", mode === "preview" && "hidden")}
        />
        {maxLength && mode === "write" && (
          <p
            id={`${id}-count`}
            className={cn(
              // Clear of the scrollbar and the handle that resizes the field.
              "pointer-events-none absolute right-5 bottom-1.5 rounded-sm bg-paper/90 px-1 font-sans text-xs tabular-nums",
              length > maxLength ? "font-bold text-brand" : "text-ink-subtle",
            )}
          >
            {length.toLocaleString("en")} / {maxLength.toLocaleString("en")}
            <span className="sr-only"> characters</span>
          </p>
        )}
        {references && mode === "write" && <CiteAutocomplete textarea={textarea} references={references} />}
      </div>
      {mode === "preview" && (
        <div className="min-h-32 rounded-sm border border-dashed border-rule-strong px-4 py-3">
          {value.trim() ? <MarkdownContent source={value} untrusted references={references ?? undefined} /> : <p className="text-ink-subtle">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
