import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

// A plain data table inside a Card: a light header row, roomy cells, a hover tint on rows.

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left text-sm", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: ComponentProps<"thead">) {
  return <thead className={cn("border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium text-zinc-500", className)} {...props} />;
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return <th className={cn("px-4 py-2.5 font-medium whitespace-nowrap first:pl-5 last:pr-5", className)} {...props} />;
}

export function TBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody className={cn("divide-y divide-zinc-100", className)} {...props} />;
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("transition-colors hover:bg-zinc-50/70", className)} {...props} />;
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3 align-middle first:pl-5 last:pr-5", className)} {...props} />;
}
