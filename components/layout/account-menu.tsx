"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { signOut } from "@/lib/auth/client";

/** Dropdown for a signed-in user. Its trigger has the same width as "Sign in", so the header never shifts. */
export function AccountMenu({ name, email, moderator }: { name: string; email: string; moderator: boolean }) {
  const [open, setOpen] = useState(false);
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
        className="cursor-pointer text-ink hover:underline"
      >
        Account ▾
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-60 rounded border border-ink bg-paper py-1 text-base shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
          <div className="border-b border-rule px-3 pt-1 pb-2">
            <p className="truncate font-bold">{name}</p>
            <p className="truncate text-sm text-ink-subtle">{email}</p>
          </div>
          <Link role="menuitem" href="/me" className={item} onClick={() => setOpen(false)}>
            My submissions
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
