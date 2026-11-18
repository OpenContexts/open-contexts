import type { Metadata } from "next";
import { isComment, loadMine, MyNav, readStatus, StatusFilter, SubmissionList } from "@/components/me/my-submissions";
import { PageTitle } from "@/components/ui";

export const metadata: Metadata = { title: "My comments", robots: { index: false } };

/** The user's comments and replies, on problems, contributions and blog posts. */
export default async function MyCommentsPage({ searchParams }: PageProps<"/me/comments">) {
  const query = await searchParams;
  const mine = await loadMine("/me/comments", query);
  const status = readStatus(query.status);
  const items = mine.items.filter(isComment);
  const shown = status ? items.filter((s) => s.status === status) : items;
  return (
    <>
      <PageTitle>My submissions</PageTitle>
      <MyNav mine={mine} current="/me/comments" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-[0.95rem] text-ink-muted">Your comments and replies in the discussions.</p>
        <StatusFilter mine={mine} page="/me/comments" items={items} status={status} />
      </div>
      <SubmissionList rows mine={mine} items={shown} empty={status ? "Nothing here." : "You have not written any comments yet."} />
    </>
  );
}
