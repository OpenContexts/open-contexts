import type { ReactNode } from "react";
import { type LogAction, type ModerationStatus, ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/cn";

const tones = {
  neutral: { pill: "bg-zinc-100 text-zinc-700 ring-zinc-200", dot: "bg-zinc-400" },
  amber: { pill: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  green: { pill: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  red: { pill: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  blue: { pill: "bg-sky-50 text-sky-800 ring-sky-200", dot: "bg-sky-500" },
  violet: { pill: "bg-violet-50 text-violet-800 ring-violet-200", dot: "bg-violet-500" },
  dark: { pill: "bg-zinc-900 text-white ring-zinc-900", dot: "bg-white" },
} as const;

export type PillTone = keyof typeof tones;

/** A small label. `dot` puts a coloured dot in front, for states (pending, approved, …). */
export function Pill({ tone = "neutral", dot, children, className }: { tone?: PillTone; dot?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", tones[tone].pill, className)}>
      {dot && <span aria-hidden className={cn("size-1.5 rounded-full", tones[tone].dot)} />}
      {children}
    </span>
  );
}

const statusLook = { pending: ["amber", "Pending"], approved: ["green", "Approved"], rejected: ["red", "Rejected"] } as const;
export function StatusPill({ status }: { status: ModerationStatus }) {
  const [tone, label] = statusLook[status];
  return (
    <Pill tone={tone} dot>
      {label}
    </Pill>
  );
}

const actionTone = { approve: "green", reject: "red", reopen: "blue", create: "green", update: "blue", delete: "red", publish: "green", unpublish: "amber" } as const;
const actionLabel = { approve: "Approved", reject: "Rejected", reopen: "Reopened", create: "Created", update: "Edited", delete: "Deleted", publish: "Published", unpublish: "Unpublished" } as const;
export function ActionPill({ action }: { action: LogAction }) {
  return (
    <Pill tone={actionTone[action]} dot>
      {actionLabel[action]}
    </Pill>
  );
}

const roleTone = { user: "neutral", moderator: "blue", admin: "dark" } as const;
export function RolePill({ role }: { role: Role }) {
  return <Pill tone={roleTone[role]}>{ROLE_LABELS[role]}</Pill>;
}

/** Small count next to a navigation item. */
export function CountBadge({ n, className }: { n: number; className?: string }) {
  if (!n) return null;
  return <span className={cn("rounded-full bg-zinc-900 px-1.5 py-px text-[11px] font-semibold text-white tabular-nums", className)}>{n}</span>;
}
