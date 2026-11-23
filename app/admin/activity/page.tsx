import Link from "next/link";
import { ActionPill, Avatar, Card, EmptyState, PageHeader, Pager, pageParam, Table, TBody, Td, Th, THead, Tr } from "@/components/admin/ui";
import { requireModerator } from "@/lib/auth/session";
import { LOG_TARGET_NOUNS } from "@/lib/constants";
import { ACTIVITY_PER_PAGE, getActivityPage, logTargetHref } from "@/lib/data/moderation";
import { formatDate, formatRelative } from "@/lib/format";

const href = (page: number) => (page > 1 ? `/admin/activity?page=${page}` : "/admin/activity");

export default function ActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  return (
    <>
      <PageHeader title="Activity log" description="Every moderation decision and every change to a problem, newest first." />
      <Activity searchParams={searchParams} />
    </>
  );
}

async function Activity({ searchParams }: Pick<PageProps<"/admin/activity">, "searchParams">) {
  await requireModerator();
  const page = pageParam((await searchParams).page);
  const { rows: decisions, total, pages } = await getActivityPage(page);
  if (!decisions.length)
    return (
      <EmptyState
        title={total ? "No entries on this page" : "No decisions yet"}
        description={total ? <Link href={href(1)} className="underline">Back to the first page</Link> : undefined}
      />
    );
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
      <Pager page={page} pages={pages} total={total} shown={decisions.length} perPage={ACTIVITY_PER_PAGE} noun={["entry", "entries"]} href={href} className="border-t border-zinc-100" />
    </Card>
  );
}
