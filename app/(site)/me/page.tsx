import type { Metadata } from "next";
import { isComment, loadMine, MyNav, NewsList, newsOf, STATUS_WORDS, SubmissionList } from "@/components/me/my-submissions";
import { ActionCard, ActionCardGrid, ButtonLink, PageTitle, PartTitle } from "@/components/ui";
import { MODERATION_STATUSES } from "@/lib/constants";
import type { MySubmission } from "@/lib/data/submissions";

export const metadata: Metadata = { title: "My submissions", robots: { index: false } };

/**
 * The start of a user's submissions: what happened since their last visit, what is still waiting for review, and
 * the way to all their contributions and comments (/me/contributions, /me/comments).
 */
export default async function MySubmissionsPage({ searchParams }: PageProps<"/me">) {
  const mine = await loadMine("/me", await searchParams);

  if (!mine.items.length) {
    return (
      <>
        <PageTitle>My submissions</PageTitle>
        <div className="mt-10 text-center">
          <p className="mb-4 text-ink-muted">You have not submitted anything yet.</p>
          <ButtonLink href="/contribute">How to contribute</ButtonLink>
        </div>
      </>
    );
  }

  const news = newsOf(mine);
  const waiting = mine.items.filter((s) => s.status === "pending");
  const contributions = mine.items.filter((s) => !isComment(s));
  const comments = mine.items.filter(isComment);
  return (
    <>
      <PageTitle>My submissions</PageTitle>
      <MyNav mine={mine} current="/me" />

      <h2 className="mb-3 font-sans text-sm font-bold">New since your last visit</h2>
      {news.length ? <NewsList mine={mine} news={news} /> : <p className="text-ink-muted">Nothing new: no decisions and no new comments on your contributions.</p>}

      <h2 className="mt-10 mb-3 font-sans text-sm font-bold">Waiting for review</h2>
      <SubmissionList mine={mine} items={waiting} empty="Nothing is waiting for review." />

      <PartTitle className="mt-14">Everything you submitted</PartTitle>
      <ActionCardGrid>
        <ActionCard href={mine.link("/me/contributions")} prefetch={false} icon="∴" title={`Contributions (${contributions.length})`} description={tally(contributions) || "Results, references, edits, proposals and posts."} />
        <ActionCard href={mine.link("/me/comments")} prefetch={false} icon="❝" title={`Comments (${comments.length})`} description={tally(comments) || "Comments and replies in the discussions."} />
      </ActionCardGrid>
    </>
  );
}

/** "3 published · 1 waiting". */
function tally(items: MySubmission[]): string {
  const counts = MODERATION_STATUSES.map((s) => [s, items.filter((i) => i.status === s).length] as const).filter(([, n]) => n > 0);
  return counts.map(([s, n]) => `${n} ${STATUS_WORDS[s]}`).join(" · ");
}
