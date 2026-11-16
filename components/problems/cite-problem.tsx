"use client";

import { type ReactNode, useState } from "react";
import { Button, CopyBlock } from "@/components/ui";
import { type CitableContribution, type CitableProblem, contributionBibtex, problemBibtex, todayIso } from "@/lib/cite";

type Citable = { problem: CitableProblem; contribution?: never } | { contribution: CitableContribution; problem?: never };

/**
 * "Cite this problem" (or contribution): opens the BibTeX entry, with a button to copy it. The entry is built
 * here, so its access date is the day of the click, not the day the cached page was rendered.
 * `children` (e.g. download links) go next to the button.
 */
export function CiteProblem({ origin, children, ...item }: Citable & { origin: string; children?: ReactNode }) {
  const [open, setOpen] = useState<string>();

  function cite() {
    if (open) return setOpen(undefined);
    const context = { origin, today: todayIso() };
    setOpen(item.problem ? problemBibtex(item.problem, context) : contributionBibtex(item.contribution, context));
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-2">
        <Button variant="quiet" size="sm" onClick={cite} aria-expanded={!!open} aria-controls="cite-problem">
          <span aria-hidden className="font-serif text-base/none">“</span>
          {item.problem ? "Cite this problem" : "Cite this contribution"}
        </Button>
        {children}
      </div>
      {open && (
        <div id="cite-problem">
          <CopyBlock
            label="BibTeX"
            text={open}
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
