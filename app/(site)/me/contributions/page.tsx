import type { Metadata } from "next";
import { isComment, loadMine, MyNav, readStatus, StatusFilter, SubmissionList } from "@/components/me/my-submissions";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "My contributions", robots: { index: false } };

/** Everything the user submitted other than comments: results, references, edits, problem proposals and blog posts. */
export default async function MyContributionsPage({ searchParams }: PageProps<"/me/contributions">) {
  const query = await searchParams;
  const mine = await loadMine("/me/contributions", query);
  const status = readStatus(query.status);
  const items = mine.items.filter((s) => !isComment(s));
  const shown = status ? items.filter((s) => s.status === status) : items;
  return (
    <>
      <PageTitle>My submissions</PageTitle>
      <MyNav mine={mine} current="/me/contributions" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-[0.95rem] text-ink-muted">Results, references, edits, problem proposals and blog posts.</p>
        <StatusFilter mine={mine} page="/me/contributions" items={items} status={status} />
      </div>
      <SubmissionList mine={mine} items={shown} empty={status ? "Nothing here." : "You have not contributed anything yet."} />
    </>
  );
}
