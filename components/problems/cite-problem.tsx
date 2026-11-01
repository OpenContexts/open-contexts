"use client";

import { type ReactNode, useState } from "react";
import { Button, CopyBlock, type CopyState, copyText } from "@/components/ui";
import { type CitableProblem, problemBibtex, todayIso } from "@/lib/cite";

/**
 * "Cite this problem": opens the problem's BibTeX entry and copies it in the same click. The entry is built
 * here, so its access date is the day of the click, not the day the cached page was rendered.
 * `children` (e.g. download links) go next to the button.
 */
export function CiteProblem({ problem, origin, children }: { problem: CitableProblem; origin: string; children?: ReactNode }) {
  const [open, setOpen] = useState<{ text: string; copied: CopyState }>();

  async function cite() {
    if (open) return setOpen(undefined);
    const text = problemBibtex(problem, { origin, today: todayIso() });
    // Copied before the box opens: browsers only allow it while handling the click.
    const copied = await copyText(text);
    setOpen({ text, copied: copied ? "copied" : "failed" });
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        <Button variant="quiet" size="sm" onClick={cite} aria-expanded={!!open} aria-controls="cite-problem">
          <span aria-hidden className="font-serif text-base/none">“</span>
          Cite this problem
        </Button>
        {children}
      </div>
      {open && (
        <div id="cite-problem">
          <CopyBlock
            label="BibTeX"
            text={open.text}
            initial={open.copied}
            className="mt-3"
            actions={
              <Button variant="ghost" size="sm" onClick={() => setOpen(undefined)} aria-label="Close">
                ×
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
