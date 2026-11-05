"use client";

import type { KeyboardEvent } from "react";
import { Button, Input, Textarea } from "@/components/ui";
import type { ReferenceRows } from "@/components/ui/use-reference-rows";
import { oneLine, type ReferenceDraft } from "@/lib/references";

/** Citation and link of one reference; side by side on wide screens. Below them, how the text cites it. */
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
      <input type="hidden" name="referenceKey[]" value={reference.key ?? ""} />
      {reference.key && <span className="-mt-1 font-mono text-xs text-ink-subtle sm:col-span-2">\cite{`{${reference.key}}`}</span>}
    </div>
  );
}

/** The proposal's references: a numbered list, and a row below it for the next one. `refs` from useReferenceRows. */
export function ReferencesField({ refs, error }: { refs: ReferenceRows; error?: string }) {
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
            <li key={row.rowId} className="flex items-start gap-2">
              <span className="w-6 flex-none pt-1.5 text-right text-sm text-ink-subtle tabular-nums">{i + 1}.</span>
              <ReferenceInputs
                reference={row}
                onChange={(patch) => refs.update(row.rowId, patch)}
                onBlur={() => refs.tidy(row.rowId)}
                onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                label={`Reference ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => refs.remove(row.rowId)}
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
        <p className="mt-1 text-sm text-ink-subtle">Add them one at a time, in the order they should be numbered. The link, e.g. a DOI or arXiv page, is optional. Cite them in the text by typing \cite{"{"}.</p>
      )}
    </fieldset>
  );
}
