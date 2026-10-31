"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProblem, updateProblem } from "@/app/admin/problems/actions";
import { MarkdownField } from "@/components/admin/markdown-field";
import { HistoryField } from "@/components/admin/history-field";
import { TagInput } from "@/components/admin/tag-input";
import { AdminButton, AdminField, AdminInput, AdminTextarea, Card } from "@/components/admin/ui";
import { AREAS } from "@/lib/areas";
import { initialFormState, errorOf, valueOf, valuesOf } from "@/lib/actions/form-state";
import { PROBLEM_STATUSES, PROBLEM_STATUS_LABELS, type ProblemStatus } from "@/lib/constants";
import type { HistoryEntry } from "@/lib/db/schema";
import { cn } from "@/lib/cn";

const STATUS_DOTS: Record<ProblemStatus, string> = { open: "bg-zinc-400", "under-revision": "bg-sky-500", solved: "bg-emerald-500" };

/** The form's starting values: lists and references already joined into text. */
export type ProblemFormValues = {
  title: string;
  /** New problems only: the preferred URL name (from an imported file); otherwise made from the title. */
  slug?: string;
  status: ProblemStatus;
  areas: string[];
  posed: string;
  posedBy: string;
  tags: string;
  statement: string;
  body: string;
  references: string;
  history: HistoryEntry[];
};

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <AdminButton type="submit" variant="primary" disabled={pending} className="w-full">
      {pending ? "Saving…" : label}
    </AdminButton>
  );
}

/**
 * Creates a problem (no `id`) or edits one. `version` guards against overwriting someone else's change.
 * New problems get the next free number and a URL name made from the title; neither changes later.
 */
export function ProblemForm({ initial, id, version, nextNumber }: { initial: ProblemFormValues; id?: string; version?: number; nextNumber?: number }) {
  const [state, action] = useActionState(id ? updateProblem : createProblem, initialFormState);
  const value = (name: Exclude<keyof ProblemFormValues, "history" | "areas">) => valueOf(state, name, String(initial[name] ?? ""));
  const error = (name: string) => errorOf(state, name);
  const areas = valuesOf(state, "areas[]", state.values ? [] : initial.areas);

  return (
    <form action={action} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      {id && <input type="hidden" name="id" value={id} />}
      {version !== undefined && <input type="hidden" name="version" value={version} />}
      {!id && initial.slug && <input type="hidden" name="slug" value={initial.slug} />}

      <div className="min-w-0 space-y-6">
        {state.status === "error" && state.message && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-red-800 ring-1 ring-red-200 ring-inset">
            {state.message}
          </p>
        )}
        <Card title="Statement and text">
          <div className="space-y-5">
            <AdminField label="Title" htmlFor="title" error={error("title")}>
              <AdminInput id="title" name="title" defaultValue={value("title")} required className="w-full" />
            </AdminField>
            <AdminField label="Statement" htmlFor="statement" error={error("statement")} hint="The precise question, shown in the red box.">
              <MarkdownField id="statement" name="statement" defaultValue={value("statement")} rows={5} invalid={!!error("statement")} />
            </AdminField>
            <AdminField label="Text" htmlFor="body" error={error("body")} hint="Use ## headings for sections such as Background, Partial progress and Significance.">
              <MarkdownField id="body" name="body" defaultValue={value("body")} rows={18} invalid={!!error("body")} />
            </AdminField>
          </div>
        </Card>

        <Card title="References">
          <AdminField label="One reference per line" htmlFor="references" error={error("references")} hint="A link anywhere in the line becomes the reference's URL.">
            <AdminTextarea id="references" name="references" rows={5} defaultValue={value("references")} className="font-mono text-[13px]" />
          </AdminField>
        </Card>

        <Card title="Progress and history">
          <HistoryField initial={initial.history} error={error("history")} />
        </Card>
      </div>

      <div className="space-y-4 lg:sticky lg:top-10">
        <Card>
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-zinc-700">Status</legend>
              <div className="space-y-1.5">
                {PROBLEM_STATUSES.map((s) => (
                  <label
                    key={s}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-zinc-700 ring-1 ring-zinc-200 ring-inset transition hover:bg-zinc-50 has-checked:bg-zinc-50 has-checked:font-medium has-checked:text-zinc-900 has-checked:ring-zinc-900 has-focus-visible:ring-2 has-focus-visible:ring-zinc-900"
                  >
                    <input type="radio" name="status" value={s} defaultChecked={value("status") === s} className="sr-only" />
                    <span aria-hidden className={cn("size-2 rounded-full", STATUS_DOTS[s])} />
                    {PROBLEM_STATUS_LABELS[s].replace(/^./, (c) => c.toUpperCase())}
                  </label>
                ))}
              </div>
              {error("status") && <p className="mt-1 text-xs text-red-600">{error("status")}</p>}
            </fieldset>
            {id && (
              <AdminField label="What changed (optional)" htmlFor="changeSummary" error={error("changeSummary")} hint="Added to the problem's public history.">
                <AdminInput id="changeSummary" name="changeSummary" defaultValue={valueOf(state, "changeSummary")} placeholder="e.g. Added the 2024 lattice results" className="w-full" />
              </AdminField>
            )}
          </div>
          <div className="-mx-5 mt-5 -mb-5 border-t border-zinc-100 bg-zinc-50/60 px-5 py-4">
            <SaveButton label={id ? "Save changes" : "Publish problem"} />
            {!id && <p className="mt-2 text-center text-xs text-zinc-500">Appears on the site right away{nextNumber ? ` as Problem ${nextNumber}` : ""}.</p>}
          </div>
        </Card>

        <Card title="Details">
          <div className="space-y-4">
            <fieldset>
              <legend className="mb-1.5 text-xs font-medium text-zinc-700">Areas</legend>
              <div className="space-y-1">
                {AREAS.map((a) => (
                  <label key={a.id} className="flex cursor-pointer items-start gap-2 text-zinc-700">
                    <input type="checkbox" name="areas[]" value={a.id} defaultChecked={areas.includes(a.id)} className="mt-0.5 accent-zinc-900" />
                    <span>
                      {a.numeral}. {a.title}
                    </span>
                  </label>
                ))}
              </div>
              {error("areas[]") && <p className="mt-1 text-xs text-red-600">{error("areas[]")}</p>}
            </fieldset>
            <AdminField label="Posed" htmlFor="posed" error={error("posed")} hint="Year, or YYYY-MM or YYYY-MM-DD.">
              <AdminInput id="posed" name="posed" defaultValue={value("posed")} required className="w-full" />
            </AdminField>
            <AdminField label="Posed by" htmlFor="posedBy" error={error("posedBy")} hint="Comma-separated.">
              <AdminInput id="posedBy" name="posedBy" defaultValue={value("posedBy")} className="w-full" />
            </AdminField>
            <AdminField label="Tags" htmlFor="tags" error={error("tags")} hint="Press Enter or type a comma after each tag.">
              <TagInput id="tags" name="tags" defaultValue={value("tags")} invalid={!!error("tags")} />
            </AdminField>
          </div>
        </Card>
      </div>
    </form>
  );
}
