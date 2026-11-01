"use client";

import type { KeyboardEvent } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import { useReferenceRows } from "@/components/ui/use-reference-rows";
import type { Reference } from "@/lib/db/schema";
import { oneLine, type ReferenceDraft } from "@/lib/references";

/** Citation and link of one reference; side by side on wide screens. */
function ReferenceInputs({
  reference,
  onChange,
  onBlur,
  onKeyDown,
  label,
  id,
}: {
  reference: ReferenceDraft;
  onChange: (patch: Partial<ReferenceDraft>) => void;
  onBlur: () => void;
  onKeyDown?: (e: KeyboardEvent) => void;
  label: string;
  id?: string;
}) {
  return (
    <div className="grid min-w-0 flex-1 items-start gap-2 sm:grid-cols-[minmax(0,1fr)_13rem]">
      {/* Grows with the citation, so a long one can be read in full. */}
      <Textarea
        id={id}
        name="referenceText[]"
        rows={1}
        value={reference.text}
        onChange={(e) => onChange({ text: oneLine(e.target.value) })}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="Authors, title, journal (year)"
        aria-label={`${label}: citation`}
        className="resize-none font-serif text-base/normal field-sizing-content"
      />
      <Input
        name="referenceUrl[]"
        type="url"
        value={reference.url}
        onChange={(e) => onChange({ url: e.target.value })}
        onKeyDown={onKeyDown}
        placeholder="https://… (optional)"
        aria-label={`${label}: link`}
      />
    </div>
  );
}

/** The proposal's references: a numbered list, and a row below it for the next one. */
export function ReferencesField({ initial = [], error }: { initial?: Reference[]; error?: string }) {
  const refs = useReferenceRows(initial);
  const addOnEnter = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      refs.add();
    }
  };

  return (
    <fieldset className="mt-3 min-w-0">
      <legend className="mb-1 block font-sans text-sm font-bold">References</legend>
      {refs.rows.length > 0 && (
        <ol className="mb-2 space-y-2">
          {refs.rows.map((row, i) => (
            <li key={row.key} className="flex items-start gap-2">
              <span className="w-6 flex-none pt-1.5 text-right text-sm text-ink-subtle tabular-nums">{i + 1}.</span>
              <ReferenceInputs
                reference={row}
                onChange={(patch) => refs.update(row.key, patch)}
                onBlur={() => refs.tidy(row.key)}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                label={`Reference ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => refs.remove(row.key)}
                aria-label={`Remove reference ${i + 1}`}
                className="flex-none cursor-pointer px-1.5 pt-1 text-lg/tight text-ink-subtle hover:text-brand"
              >
                ×
              </button>
            </li>
          ))}
        </ol>
      )}
      <div className="flex items-start gap-2 rounded-sm border border-rule bg-surface p-2">
        <ReferenceInputs id="references" reference={refs.draft} onChange={refs.setDraft} onBlur={refs.tidyDraft} onKeyDown={addOnEnter} label="New reference" />
        <Button variant="quiet" onClick={refs.add} disabled={!refs.canAdd} aria-label="Add reference" className="mt-0.5 flex-none">
          Add
        </Button>
      </div>
      {error ? (
        <p className="mt-1 text-sm text-brand">{error}</p>
      ) : (
        <p className="mt-1 text-sm text-ink-subtle">Add them one at a time, in the order they should be numbered. The link, e.g. a DOI or arXiv page, is optional.</p>
      )}
    </fieldset>
  );
}
