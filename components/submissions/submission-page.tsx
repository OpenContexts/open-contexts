import Link from "next/link";
import type { ReactNode } from "react";
import { PageTitle } from "@/components/ui";

/** Frame for every submission form: where you came from, what you're doing, what happens next. */
export function SubmissionPage({
  back,
  title,
  intro,
  children,
}: {
  back: { href: string; label: string };
  title: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      <p className="mt-6 text-[0.92rem]">
        <Link href={back.href} className="text-brand hover:underline">
          ← {back.label}
        </Link>
      </p>
      <PageTitle className="mt-5">{title}</PageTitle>
      <div className="mb-2 text-justify hyphens-auto max-sm:text-left">{intro}</div>
      {children}
      <ReviewNote />
    </>
  );
}

export function ReviewNote() {
  return (
    <p className="mt-8 border-t border-rule pt-3 text-sm text-ink-subtle">
      Every submission is read by a moderator before it appears on the site, usually within a few days. You can
      follow its status under{" "}
      <Link href="/me" className="text-brand hover:underline">
        My submissions
      </Link>
      .
    </p>
  );
}
