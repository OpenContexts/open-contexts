"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/site";
import { cn } from "@/lib/cn";

/** The main links; `pathname` highlights the current section. */
export function NavLinkList({ pathname }: { pathname?: string }) {
  return (
    <>
      {NAV.map(({ href, label }) => {
        const active = !!pathname && (pathname === href || pathname.startsWith(`${href}/`));
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

/** Reads the URL, so it sits in <Suspense> with `<NavLinkList />` as the fallback (same size, no highlight). */
export function NavLinks() {
  return <NavLinkList pathname={usePathname()} />;
}
