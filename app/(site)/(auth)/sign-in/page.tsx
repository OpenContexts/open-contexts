import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTitle } from "@/components/ui";
import { isGitHubConfigured } from "@/lib/auth/github";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function SignInPage() {
  return (
    <>
      <PageTitle>Sign in</PageTitle>
      {/* The form reads ?next= and ?error= with useSearchParams, which needs a boundary. */}
      <Suspense>
        <SignInForm github={isGitHubConfigured()} />
      </Suspense>
    </>
  );
}
