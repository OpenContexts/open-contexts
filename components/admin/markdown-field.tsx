"use client";

import { useRef, useState } from "react";
import { AdminTextarea } from "@/components/admin/ui";
import { CiteAutocomplete, useCitations } from "@/components/markdown/cite-autocomplete";
import { MarkdownContent } from "@/components/markdown/markdown";
import { cn } from "@/lib/cn";

/**
 * A markdown textarea with a preview in the site's typography. Uncontrolled, so form resets work.
 * Inside a CitationsProvider, typing \cite{ offers the references to cite.
 */
export function MarkdownField({ id, name, defaultValue, rows, invalid }: { id: string; name: string; defaultValue: string; rows: number; invalid?: boolean }) {
  const [preview, setPreview] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const references = useCitations();
  const tab = (on: boolean, label: string) => (
    <button
      type="button"
      onClick={() => setPreview(on)}
      aria-pressed={preview === on}
      className={cn("cursor-pointer rounded px-2 py-0.5 text-xs", preview === on ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-900")}
    >
      {label}
    </button>
  );
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1">
        {tab(false, "Write")}
        {tab(true, "Preview")}
        <span className="ml-auto text-xs text-zinc-400">
          Markdown · math with $…$ and $$…$${references && <> · cite with \cite{"{…}"}</>}
        </span>
      </div>
      <div className="relative">
        <AdminTextarea
          ref={textarea}
          id={id}
          name={name}
          rows={rows}
          defaultValue={defaultValue}
          aria-invalid={invalid || undefined}
          onInput={(e) => setValue(e.currentTarget.value)}
          className={cn("font-mono text-[13px] leading-relaxed", invalid && "ring-red-400", preview && "hidden")}
        />
        {references && !preview && <CiteAutocomplete textarea={textarea} references={references} admin />}
      </div>
      {preview && (
        <div className="min-h-32 rounded-md px-4 py-3 font-serif text-[16px] text-ink ring-1 ring-zinc-200 ring-inset">
          {value.trim() ? <MarkdownContent source={value} references={references ?? undefined} /> : <p className="text-zinc-400">Nothing to preview yet.</p>}
        </div>
      )}
    </div>
  );
}
