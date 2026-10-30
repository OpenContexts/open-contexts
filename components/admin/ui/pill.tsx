import type { ReactNode } from "react";
import { type LogAction, type ModerationStatus, ROLE_LABELS, type Role } from "@/lib/constants";
import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-zinc-100 text-zinc-700",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  dark: "bg-zinc-900 text-white",
} as const;

export function Pill({ tone = "neutral", children, className }: { tone?: keyof typeof tones; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ring-transparent", tones[tone], className)}>{children}</span>;
}

const statusTone = { pending: "amber", approved: "green", rejected: "red" } as const;
export function StatusPill({ status }: { status: ModerationStatus }) {
  return <Pill tone={statusTone[status]}>{status}</Pill>;
}

const actionTone = { approve: "green", reject: "red", reopen: "blue", create: "green", update: "blue", delete: "red" } as const;
const actionLabel = { approve: "approved", reject: "rejected", reopen: "reopened", create: "created", update: "edited", delete: "deleted" } as const;
export function ActionPill({ action }: { action: LogAction }) {
  return <Pill tone={actionTone[action]}>{actionLabel[action]}</Pill>;
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
