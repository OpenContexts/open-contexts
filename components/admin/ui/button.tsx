import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "destructive" | "ghost";
type Size = "sm" | "md";

const variants: Record<Variant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-700 shadow-sm",
  secondary: "bg-white text-zinc-900 ring-1 ring-inset ring-zinc-300 hover:bg-zinc-50 shadow-sm",
  danger: "bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 shadow-sm",
  /** For the final confirmation of a destructive action. */
  destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
};
const sizes: Record<Size, string> = {
  sm: "h-7 px-2.5 text-xs",
  md: "h-9 px-3.5 text-sm",
};

export function adminButtonStyles({ variant = "secondary", size = "md", className }: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function AdminButton({ variant, size, className, type = "button", ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button type={type} className={adminButtonStyles({ variant, size, className })} {...props} />;
}

export function AdminButtonLink({ variant, size, className, ...props }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={adminButtonStyles({ variant, size, className })} {...props} />;
}
