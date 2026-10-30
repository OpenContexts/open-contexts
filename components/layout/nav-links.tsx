"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/site";
import { cn } from "@/lib/cn";

/** The main links, with the current section highlighted. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn("hover:underline", active ? "text-brand" : "text-ink")}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
