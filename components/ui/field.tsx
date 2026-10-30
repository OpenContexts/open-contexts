import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Label({ htmlFor, children, className }: { htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1 block font-sans text-sm font-bold", className)}>
      {children}
    </label>
  );
}

/** A form row: label, control, optional hint and error. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-3", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error && <p className="mt-1 text-sm text-ink-subtle">{hint}</p>}
      {error && <p className="mt-1 text-sm text-brand">{error}</p>}
    </div>
  );
}

export function Fieldset({ legend, children, className }: { legend: ReactNode; children: ReactNode; className?: string }) {
  return (
    <fieldset className={cn("mb-5 min-w-0 rounded border border-rule px-4 pt-2 pb-4", className)}>
      <legend className="px-1.5 font-sans text-sm font-bold">{legend}</legend>
      {children}
    </fieldset>
  );
}
