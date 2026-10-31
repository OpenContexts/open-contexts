import Link from "next/link";
import { ActionPill, Avatar, Card, EmptyState, PageHeader, Table, TBody, Td, Th, THead, Tr } from "@/components/admin/ui";
import { requireModerator } from "@/lib/auth/session";
import { LOG_TARGET_NOUNS } from "@/lib/constants";
import { getRecentActivity, logTargetHref } from "@/lib/data/moderation";
import { formatDate, formatRelative } from "@/lib/format";

export default function ActivityPage() {
  return (
    <>
      <PageHeader title="Activity log" description="Every moderation decision and every change to a problem, newest first." />
      <Activity />
    </>
  );
}

async function Activity() {
  await requireModerator();
  const decisions = await getRecentActivity(200);
  if (!decisions.length) return <EmptyState title="No decisions yet" />;
  return (
    <Card padded={false}>
      <Table>
        <THead>
          <tr>
            <Th>When</Th>
            <Th>Action</Th>
            <Th>On</Th>
            <Th>Moderator</Th>
            <Th>Note</Th>
          </tr>
        </THead>
        <TBody>
          {decisions.map((d) => (
            <Tr key={d.id}>
              <Td className="whitespace-nowrap text-zinc-500 tabular-nums" title={formatRelative(d.createdAt)}>
                {formatDate(d.createdAt)}
              </Td>
              <Td>
                <ActionPill action={d.action} />
              </Td>
              <Td>
                <Link href={logTargetHref(d.targetType, d.targetId)} className="font-medium text-zinc-900 hover:underline">
                  {LOG_TARGET_NOUNS[d.targetType].replace(/^./, (c) => c.toUpperCase())}
                </Link>
              </Td>
              <Td>
                {d.moderator ? (
                  <span className="flex items-center gap-2 whitespace-nowrap text-zinc-700">
                    <Avatar name={d.moderator.name} className="size-6 text-[10px]" />
                    {d.moderator.name}
                  </span>
                ) : (
                  <span className="text-zinc-400">deleted user</span>
                )}
              </Td>
              <Td className="max-w-md text-zinc-500">{d.note}</Td>
            </Tr>
          ))}
        </TBody>
      </Table>
    </Card>
  );
}
