"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ReactNode, useState, useTransition } from "react";
import { Button, Callout, Field, Input } from "@/components/ui";
import { signUp } from "@/lib/auth/client";
import { INSTITUTIONAL_EMAIL_MESSAGE } from "@/lib/auth/institutional-messages";
import { checkInstitutionalEmail } from "../actions";
import { authErrorMessage, safeNext } from "../shared";

/**
 * `alternative` (e.g. signing up with ORCID or GitHub) is shown below the form, until the form has been sent;
 * `alternativeNames` ("ORCID or GitHub") points to it when an address is not recognized.
 */
export function SignUpForm({ alternativeNames, alternative }: { alternativeNames?: string; alternative?: ReactNode }) {
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const [emailHint, setEmailHint] = useState<"ok" | "bad" | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function checkEmail(email: string) {
    if (!email.includes("@")) return setEmailHint(null);
    setEmailHint((await checkInstitutionalEmail(email)) ? "ok" : "bad");
  }

  function submit(formData: FormData) {
    const email = String(formData.get("email"));
    setError(null);
    startTransition(async () => {
      const { error } = await signUp.email({
        name: String(formData.get("name")),
        email,
        password: String(formData.get("password")),
        callbackURL: next,
      });
      if (error) return setError(authErrorMessage(error));
      setSentTo(email);
    });
  }

  if (sentTo) {
    return (
      <Callout tone="success">
        <p className="mb-2 font-bold">Check your inbox</p>
        <p>
          We have sent a confirmation link to <strong>{sentTo}</strong>. Open it to activate your account; you will
          be signed in automatically. The link is valid for one hour.
        </p>
      </Callout>
    );
  }

  return (
    <>
      {error && <Callout tone="error">{error}</Callout>}
      <form action={submit}>
        <Field label="Full name" htmlFor="name" hint="Shown with your comments and contributions.">
          <Input id="name" name="name" required autoComplete="name" />
        </Field>
        <Field
          label="Institutional email"
          htmlFor="email"
          hint={emailHint === "ok" ? <span className="text-success">✓ Recognized as an institutional address.</span> : "e.g. name@uni-example.edu"}
          error={emailHint === "bad" ? `${INSTITUTIONAL_EMAIL_MESSAGE}${alternativeNames ? ` Or sign up with ${alternativeNames} below.` : ""}` : undefined}
        >
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={emailHint === "bad" || undefined}
            onBlur={(e) => checkEmail(e.target.value)}
            onChange={() => emailHint && setEmailHint(null)}
          />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <Button type="submit" disabled={pending || emailHint === "bad"} className="mt-5 w-full">
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      {alternative}
      <p className="mt-6 border-t border-rule pt-4 text-center text-[0.95rem]">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
