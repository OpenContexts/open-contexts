"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, Callout, Field, Input } from "@/components/ui";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "../shared";

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const { error } = await authClient.requestPasswordReset({
        email: String(formData.get("email")),
        redirectTo: "/reset-password",
      });
      if (error) return setError(authErrorMessage(error));
      setSent(true);
    });
  }

  if (sent) {
    return (
      <Callout tone="success">
        If an account exists for this address, we have sent it a link to reset the password. The link is valid for
        one hour.
      </Callout>
    );
  }

  return (
    <>
      {error && <Callout tone="error">{error}</Callout>}
      <form action={submit}>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Button type="submit" disabled={pending} className="mt-5 w-full">
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-6 border-t border-rule pt-4 text-center text-[0.95rem]">
        <Link href="/sign-in" className="text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
