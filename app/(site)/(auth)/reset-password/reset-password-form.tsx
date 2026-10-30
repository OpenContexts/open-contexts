"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Callout, Field, Input } from "@/components/ui";
import { authClient } from "@/lib/auth/client";
import { authErrorMessage } from "../shared";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");
  const [error, setError] = useState<string | null>(authErrorMessage(params.get("error")));
  const [pending, startTransition] = useTransition();

  if (!token) {
    return (
      <>
        <Callout tone="error">{error ?? "This link is incomplete. Please request a new one."}</Callout>
        <p className="text-center">
          <Link href="/forgot-password" className="text-brand hover:underline">
            Request a new link
          </Link>
        </p>
      </>
    );
  }

  function submit(formData: FormData) {
    const password = String(formData.get("password"));
    if (password !== formData.get("confirm")) return setError("The two passwords do not match.");
    setError(null);
    startTransition(async () => {
      const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
      if (error) return setError(authErrorMessage(error));
      router.push("/sign-in?reset=success");
    });
  }

  return (
    <>
      {error && <Callout tone="error">{error}</Callout>}
      <form action={submit}>
        <Field label="New password" htmlFor="password" hint="At least 8 characters.">
          <Input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <Field label="Repeat the new password" htmlFor="confirm">
          <Input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        <Button type="submit" disabled={pending} className="mt-5 w-full">
          {pending ? "Saving…" : "Set new password"}
        </Button>
      </form>
    </>
  );
}
