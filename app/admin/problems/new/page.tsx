import type { Metadata } from "next";
import { NewProblemEditor } from "@/components/admin/new-problem-editor";
import { PageHeader } from "@/components/admin/ui";
import { requireModerator } from "@/lib/auth/session";
import { nextProblemNumber, today } from "@/lib/data/problem-writes";

export const metadata: Metadata = { title: "New problem" };

export default function NewProblemPage() {
  return (
    <>
      <PageHeader back={{ href: "/admin/problems", label: "Problems" }} title="New problem" description="On the site as soon as you save it, in the problem list or as an additional problem. Users can then comment, contribute and suggest edits." />
      <NewProblem />
    </>
  );
}

async function NewProblem() {
  await requireModerator();
  const nextNumber = await nextProblemNumber();
  return (
    <NewProblemEditor
      nextNumber={nextNumber}
      blank={{
        title: "",
        status: "open",
        agenda: [],
        posed: today().slice(0, 4),
        posedBy: "",
        tags: "",
        statement: "",
        body: "## Background\n\n\n\n## Relevance\n\n\n\n## Significance\n\n",
        references: [],
        note: "",
        history: [],
      }}
    />
  );
}
