import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "quiet" | "ghost";
type Size = "sm" | "md";

type ButtonStyleProps = { variant?: Variant; size?: Size; className?: string };

const variants: Record<Variant, string> = {
  primary: "border-brand-dark bg-brand-strong text-white hover:brightness-110",
  quiet: "border-ink bg-paper text-ink hover:bg-surface",
  ghost: "border-transparent bg-transparent text-ink hover:bg-surface",
};

const sizes: Record<Size, string> = {
  sm: "px-2.5 py-1 text-xs",
  md: "px-3.5 py-1.5 text-sm",
};

function buttonStyles({ variant = "primary", size = "md", className }: ButtonStyleProps = {}) {
  return cn(
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded border-[1.5px] font-sans leading-tight font-bold no-underline transition disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & ButtonStyleProps) {
  return <button type={type} className={buttonStyles({ variant, size, className })} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyleProps) {
  return <Link className={buttonStyles({ variant, size, className })} {...props} />;
}
