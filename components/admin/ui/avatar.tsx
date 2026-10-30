import { cn } from "@/lib/cn";

/** A person's initials in a grey circle. */
export function Avatar({ name, className }: { name: string; className?: string }) {
  const letters = name.split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span aria-hidden className={cn("flex size-8 flex-none items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200", className)}>
      {letters}
    </span>
  );
}
