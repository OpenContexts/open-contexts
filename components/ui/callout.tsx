import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

const tones = {
  notice: "border-gold bg-gold-tint",
  success: "border-success bg-success-tint",
  error: "border-brand bg-brand-tint",
} as const;

export function Callout({
  tone = "notice",
  children,
  className,
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cn("my-4 border-l-[3px] px-3.5 py-2.5 text-[0.98rem]", tones[tone], className)}>
      {children}
    </div>
  );
}
