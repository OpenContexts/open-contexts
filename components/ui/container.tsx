import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** The site's single reading column. */
export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-measure px-5", className)}>{children}</div>;
}
