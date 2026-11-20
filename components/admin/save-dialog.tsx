"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AdminButton, AdminDialog, AdminField, AdminInput, AdminSelect, DialogActions } from "@/components/admin/ui";
import { errorOf, type FormState, valueOf } from "@/lib/actions/form-state";
import { AI_USE, AI_USE_LABELS, PROBLEM_STATUS_LABELS } from "@/lib/constants";
import { contentChars, MINOR_CHARS, nothingChanged, type ProblemChanges, versionTouched } from "./problem-changes";

const capitalize = (s: string) => s.replace(/^./, (c) => c.toUpperCase());

/** "12 characters", or "1,000+ characters" for a change too large to count exactly. */
const size = (n: number) => (n >= 1_000 ? "1,000+ characters" : n === 1 ? "1 character" : `${n.toLocaleString("en")} characters`);

/**
 * Asks what saving an edit of a problem needs, and only that, after "Save changes": what changed, whether it is
 * minor, its summary for the history, and for a new version whom it credits and how much AI it used. Rendered
 * inside the editor's form, so its fields are sent with it. The rules are updateProblem's:
 * - a change to the title, statement, text, references or note needs a summary, unless it is minor;
 * - a minor change corrects the current version instead of starting one, which keeps its credit;
 * - a change of status is recorded with the summary as its text, or a standard one.
 * `opening` starts the fields afresh with each opening, the checkbox from `minor`: React sets a checkbox's default
 * only when it mounts, and the reset after a failed save would otherwise turn it back to an earlier one.
 */
export function SaveDialog({
  open,
  onClose,
  changes,
  minor: minorAtStart,
  opening,
  state,
}: {
  open: boolean;
  onClose: () => void;
  changes: ProblemChanges;
  minor: boolean;
  opening: number;
  state: FormState;
}) {
  return (
    <AdminDialog open={open} onClose={onClose} title="Save changes">
      <Body key={opening} changes={changes} minorAtStart={minorAtStart} state={state} onClose={onClose} />
    </AdminDialog>
  );
}

function Body({ changes: c, minorAtStart, state, onClose }: { changes: ProblemChanges; minorAtStart: boolean; state: FormState; onClose: () => void }) {
  const [minor, setMinor] = useState(minorAtStart);
  const error = (name: string) => errorOf(state, name);
  if (nothingChanged(c)) {
    return (
      <>
        <p className="mt-2 text-zinc-600">Nothing has changed yet.</p>
        <DialogActions>
          <AdminButton onClick={onClose}>Close</AdminButton>
        </DialogActions>
      </>
    );
  }

  const content = contentChars(c) > 0;
  const version = versionTouched(c);
  const summaryRequired = content && !minor;
  // A minor fix goes without a history entry; only a change of status in the same save still takes a text.
  const askSummary = !(content && minor && !c.status);
  const newVersion = version && !minor;
  const parts = [
    c.title > 0 && `Title · ${size(c.title)}`,
    c.statement > 0 && `Statement · ${size(c.statement)}`,
    c.body > 0 && `Text · ${size(c.body)}`,
    c.references > 0 && `References · ${size(c.references)}`,
    c.note > 0 && `Note · ${size(c.note)}`,
    c.status && `Status · ${capitalize(PROBLEM_STATUS_LABELS[c.status.from])} → ${capitalize(PROBLEM_STATUS_LABELS[c.status.to])}`,
    c.details && "Details · agenda, posed, posed by or tags",
    c.history && "Progress and history",
  ].filter(Boolean);

  return (
    <div className="mt-3 space-y-4">
      <div>
        <p className="mb-1 text-xs font-medium text-zinc-500">What you changed</p>
        <ul className="space-y-0.5 text-zinc-700">
          {parts.map((p) => (
            <li key={String(p)} className="flex gap-2">
              <span aria-hidden className="text-zinc-400">
                •
              </span>
              {p}
            </li>
          ))}
        </ul>
      </div>

      {content && (
        <label className="flex cursor-pointer items-start gap-2 rounded-md bg-zinc-50 px-3 py-2.5 text-zinc-700 ring-1 ring-zinc-200 ring-inset">
          <input type="checkbox" name="minor" checked={minor} onChange={(e) => setMinor(e.target.checked)} className="mt-0.5 accent-zinc-900" />
          <span>
            Minor change
            <span className="block text-xs text-zinc-500">
              {!c.status && "Not recorded in the history."}{" "}
              {contentChars(c) <= MINOR_CHARS && `Suggested, since only ${size(contentChars(c))} changed.`}
            </span>
          </span>
        </label>
      )}

      {askSummary && (
      <AdminField
        label={summaryRequired ? "What changed" : "What changed (optional)"}
        htmlFor="changeSummary"
        error={error("changeSummary")}
        hint={
          c.status
            ? `The history entry for the change of status. Left empty, it reads “Status changed to ${PROBLEM_STATUS_LABELS[c.status.to]}.”`
            : summaryRequired
              ? "Added to the problem's public history."
              : "Added to the problem's public history if given."
        }
      >
        <AdminInput
          id="changeSummary"
          name="changeSummary"
          defaultValue={valueOf(state, "changeSummary")}
          required={summaryRequired}
          placeholder="e.g. Added the 2024 lattice results"
          autoFocus
          className="w-full"
        />
      </AdminField>
      )}

      {newVersion && (
        <>
          <AdminField
            label="Credit (optional)"
            htmlFor="credit"
            error={error("credit")}
            hint="Left empty, it reads “by the editors”."
          >
            <AdminInput id="credit" name="credit" defaultValue={valueOf(state, "credit")} placeholder="e.g. Jane Doe (ETH Zürich)" className="w-full" />
          </AdminField>
          <AdminField label="AI use in the change (optional)" htmlFor="aiUse" error={error("aiUse")}>
            <AdminSelect id="aiUse" name="aiUse" defaultValue={valueOf(state, "aiUse")} className="h-9 w-full">
              <option value="">Not stated</option>
              {AI_USE.map((a) => (
                <option key={a} value={a}>
                  {capitalize(AI_USE_LABELS[a])}
                </option>
              ))}
            </AdminSelect>
          </AdminField>
        </>
      )}

      <p className="text-xs text-zinc-500">
        <span className="text-brand">{newVersion ? "Starts a new version of the problem, with its own permanent link." : version ? "Corrects the current version of the problem." : "The text of the problem stays as it is."}</span> Saved changes
        appear on the site right away.
      </p>

      <DialogActions>
        <AdminButton onClick={onClose}>Cancel</AdminButton>
        <Submit />
      </DialogActions>
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <AdminButton type="submit" variant="primary" disabled={pending}>
      {pending ? "Saving…" : "Save changes"}
    </AdminButton>
  );
}
