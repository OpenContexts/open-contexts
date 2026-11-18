"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { AppleIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { signOut } from "@/lib/auth/client";

/**
 * Dropdown for a signed-in user. Its trigger has the same width as "Sign in", so the header never shifts.
 * `news`: decisions on their submissions and comments on their contributions since they last opened /me, shown
 * as a red apple with the number.
 */
export function AccountMenu({ name, email, moderator, news }: { name: string; email: string; moderator: boolean; news: number }) {
  const [open, setOpen] = useState(false);
  // Opening /me (or a page under it) marks the decisions seen on the server, but the header is not rendered again on the way there:
  // the count is put away here once the page is open, until the server reports a different one.
  const pathname = usePathname();
  const [cleared, setCleared] = useState(0);
  if ((pathname === "/me" || pathname.startsWith("/me/")) && news !== cleared) setCleared(news);
  const unseen = news !== cleared ? news : 0;
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "block w-full px-3 py-1.5 text-left text-ink hover:bg-surface";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(!open)}
        className="relative cursor-pointer text-ink hover:underline"
      >
        Account ▾
        {unseen > 0 && (
          <>
            <AppleCount n={unseen} large className="absolute -top-3 -right-4" />
            <span className="sr-only">, {unseen === 1 ? "one update" : `${unseen} updates`} on your submissions</span>
          </>
        )}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-60 rounded border border-ink bg-paper py-1 text-base shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="border-b border-rule px-3 pt-1 pb-2">
            <p className="truncate font-bold">{name}</p>
            <p className="truncate text-sm text-ink-subtle">{email}</p>
          </div>
          {/* Not prefetched: opening /me records the visit, which only a click should do. */}
          <Link role="menuitem" href="/me" prefetch={false} className={`${item} flex items-center justify-between gap-2`} onClick={() => setOpen(false)}>
            My submissions
            {unseen > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-brand">
                {unseen} new
                <AppleCount n={unseen} />
              </span>
            )}
          </Link>
          {moderator && (
            <Link role="menuitem" href="/admin" className={item} onClick={() => setOpen(false)}>
              Admin dashboard
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            disabled={pending}
            className={`${item} cursor-pointer border-t border-rule disabled:opacity-50`}
            onClick={() =>
              startTransition(async () => {
                await signOut();
                setOpen(false);
                router.refresh();
              })
            }
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

/** A small red apple with a number on it, like the badge on an app icon. `large`: on the menu's trigger, with room for "9+". */
function AppleCount({ n, large, className }: { n: number; large?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex items-center justify-center", large ? "size-[1.45rem]" : "size-5", className)}>
      <AppleIcon className="absolute inset-0 size-full" />
      <span className={cn("relative top-[2px] font-sans font-bold text-white tabular-nums", large ? "text-[0.64rem]/none" : "text-[0.6rem]/none")}>{n > 9 ? "9+" : n}</span>
    </span>
  );
}
