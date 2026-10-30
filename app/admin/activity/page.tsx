import Link from "next/link";
import { Suspense } from "react";
import { ActionPill, Card, EmptyState, PageHeader } from "@/components/admin/ui";
import { requireModerator } from "@/lib/auth/session";
import { LOG_TARGET_NOUNS } from "@/lib/constants";
import { getRecentDecisions, logTargetHref } from "@/lib/data/moderation";
import { formatDate } from "@/lib/format";

export default function ActivityPage() {
  return (
    <>
      <PageHeader title="Activity log" description="Every moderation decision and every change to a problem, newest first." />
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-zinc-100" />}>
        <Activity />
      </Suspense>
    </>
  );
}

async function Activity() {
  await requireModerator();
  const decisions = await getRecentDecisions(200);
  if (!decisions.length) return <EmptyState title="No decisions yet" />;
  return (
    <Card padded={false}>
      <table className="w-full text-left">
        <thead className="border-b border-zinc-100 text-xs text-zinc-500">
          <tr>
            <th className="px-5 py-2.5 font-medium">When</th>
            <th className="px-3 py-2.5 font-medium">Action</th>
            <th className="px-3 py-2.5 font-medium">On</th>
            <th className="px-3 py-2.5 font-medium">Moderator</th>
            <th className="px-5 py-2.5 font-medium">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {decisions.map((d) => (
            <tr key={d.id} className="align-top">
              <td className="px-5 py-2.5 whitespace-nowrap text-zinc-500 tabular-nums">{formatDate(d.createdAt)}</td>
              <td className="px-3 py-2.5"><ActionPill action={d.action} /></td>
              <td className="px-3 py-2.5">
                <Link href={logTargetHref(d.targetType, d.targetId)} className="hover:underline">
                  {LOG_TARGET_NOUNS[d.targetType]}
                </Link>
              </td>
              <td className="px-3 py-2.5 text-zinc-700">{d.moderator?.name ?? "deleted user"}</td>
              <td className="px-5 py-2.5 text-zinc-500">{d.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
