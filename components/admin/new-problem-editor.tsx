"use client";

import { useRef, useState, useTransition } from "react";
import { parseProblemFile } from "@/app/admin/problems/actions";
import { ProblemForm, type ProblemFormValues } from "@/components/admin/problem-form";
import { AdminButton } from "@/components/admin/ui";

/** The new-problem form, which can be filled from an uploaded .md file before saving. */
export function NewProblemEditor({ blank, nextNumber }: { blank: ProblemFormValues; nextNumber: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [initial, setInitial] = useState(blank);
  const [imported, setImported] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped on every import, so the (uncontrolled) form starts over from the file's values.
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();

  function load(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      const result = file.size > 1_000_000 ? { error: "This file is too large for a problem (over 1 MB)." } : await parseProblemFile({ name: file.name, text: await file.text() });
      if (result.error || !result.values) return setError(result.error ?? "The file could not be read.");
      setInitial(result.values);
      setImported(file.name);
      setFormKey((k) => k + 1);
    });
    if (input.current) input.current.value = "";
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-white px-5 py-3 ring-1 ring-zinc-200">
        <p className="min-w-0 flex-1 text-zinc-600">
          {imported ? (
            <>
              Filled in from <span className="font-medium text-zinc-900">{imported}</span>. Check the fields, then save.
            </>
          ) : (
            "Start from a markdown file, for example one downloaded from this dashboard."
          )}
        </p>
        <input ref={input} type="file" accept=".md,.markdown,text/markdown,text/plain" className="hidden" onChange={(e) => load(e.target.files?.[0])} aria-label="Markdown file" />
        <AdminButton onClick={() => input.current?.click()} disabled={pending}>
          {pending ? "Reading…" : imported ? "Upload another .md file" : "Upload .md file"}
        </AdminButton>
        {error && <p className="w-full text-xs text-red-600">{error}</p>}
      </div>
      <ProblemForm key={formKey} initial={initial} nextNumber={nextNumber} />
    </>
  );
}
