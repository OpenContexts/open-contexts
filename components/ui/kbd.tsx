import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded-sm border border-rule-strong bg-surface px-1 font-mono text-[0.85em]">{children}</kbd>;
}
