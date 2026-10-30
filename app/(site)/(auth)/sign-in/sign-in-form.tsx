"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Button, Callout, Field, Input } from "@/components/ui";
import { signIn } from "@/lib/auth/client";
import { GitHubButton, OrDivider } from "../github-button";
import { authErrorMessage, safeNext } from "../shared";

export function SignInForm({ github }: { github: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [error, setError] = useState<string | null>(authErrorMessage(params.get("error")));
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const { error } = await signIn.email({
        email: String(formData.get("email")),
        password: String(formData.get("password")),
        callbackURL: next,
      });
      if (error) return setError(authErrorMessage(error));
      router.push(next);
      router.refresh();
    });
  }

  const signUpHref = next === "/" ? "/sign-up" : `/sign-up?next=${encodeURIComponent(next)}`;
  return (
    <>
      {params.get("reset") === "success" && <Callout tone="success">Your password has been changed. Please sign in.</Callout>}
      {error && <Callout tone="error">{error}</Callout>}
      <form action={submit}>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="password">
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </Field>
        <p className="mt-1.5 text-right text-sm">
          <Link href="/forgot-password" className="text-brand hover:underline">
            Forgot your password?
          </Link>
        </p>
        <Button type="submit" disabled={pending} className="mt-4 w-full">
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {github && (
        <>
          <OrDivider />
          <GitHubButton />
        </>
      )}

      <p className="mt-6 border-t border-rule pt-4 text-center text-[0.95rem]">
        New here?{" "}
        <Link href={signUpHref} className="text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
