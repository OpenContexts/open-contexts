import Link from "next/link";
import { Callout } from "@/components/ui";
import type { FormState } from "@/lib/actions/form-state";

export function FormMessage({ state }: { state: FormState }) {
  if (state.status !== "error" || !state.message) return null;
  return <Callout tone="error">{state.message}</Callout>;
}

/** Shown in place of the form once a submission went through. */
export function SubmissionReceived({ noun, back }: { noun: string; back?: { href: string; label: string } }) {
  return (
    <Callout tone="success" className="my-6">
      <p className="mb-1 font-bold">Thank you — your {noun} has been received.</p>
      <p>
        A moderator will review it before it appears on the site. You can follow its status under{" "}
        <Link href="/me" className="text-brand hover:underline">
          My submissions
        </Link>
        {back && (
          <>
            , or go{" "}
            <Link href={back.href} className="text-brand hover:underline">
              {back.label}
            </Link>
          </>
        )}
        .
      </p>
    </Callout>
  );
}
