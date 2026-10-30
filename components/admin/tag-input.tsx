"use client";

import { type KeyboardEvent, useState } from "react";
import { cn } from "@/lib/cn";

const split = (text: string) =>
  text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

/**
 * Tags as removable chips with a text field after them: Enter or a comma adds what was typed, Backspace in
 * the empty field removes the last one. Submits as one comma-separated value under `name`, like a plain
 * text input would; text that was typed but not added yet is included.
 */
export function TagInput({ id, name, defaultValue, placeholder = "Add a tag", invalid }: { id: string; name: string; defaultValue: string; placeholder?: string; invalid?: boolean }) {
  const [tags, setTags] = useState(() => split(defaultValue));
  const [draft, setDraft] = useState("");

  const add = (text: string) => {
    const fresh = split(text).filter((t) => !tags.some((x) => x.toLowerCase() === t.toLowerCase()));
    if (fresh.length) setTags([...tags, ...fresh]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault(); // Enter would submit the form
      add(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };

  return (
    <div
      className={cn(
        "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md bg-white px-2 py-1.5 ring-1 ring-inset focus-within:ring-2 focus-within:ring-zinc-900",
        invalid ? "ring-red-400" : "ring-zinc-300",
      )}
    >
      <input type="hidden" name={name} value={[...tags, draft.trim()].filter(Boolean).join(", ")} />
      {tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-zinc-100 py-0.5 pr-1 pl-2 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200 ring-inset">
          {t}
          <button
            type="button"
            onClick={() => setTags(tags.filter((x) => x !== t))}
            aria-label={`Remove ${t}`}
            className="cursor-pointer rounded px-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-900"
          >
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => (e.target.value.includes(",") ? add(e.target.value) : setDraft(e.target.value))}
        onKeyDown={onKeyDown}
        onBlur={() => draft.trim() && add(draft)}
        placeholder={tags.length ? "" : placeholder}
        className="min-w-24 flex-1 border-0 bg-transparent p-0 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-0 focus:outline-none"
      />
    </div>
  );
}
