import type { Metadata } from "next";
import { Suspense } from "react";
import { PageTitle } from "@/components/ui";
import { isGitHubConfigured } from "@/lib/auth/github";
import { GitHubButton, OrDivider } from "../github-button";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function SignUpPage() {
  const github = isGitHubConfigured();
  return (
    <>
      <PageTitle>Create an account</PageTitle>
      {github ? (
        <>
          <p className="mb-5 text-[0.98rem] text-ink-muted">
            Accounts are for researchers. Sign up with your GitHub account, or with the email address of your
            university or research institute.
          </p>
          <h2 className="mb-1 font-bold">With GitHub</h2>
          <p className="mb-3 text-[0.95rem] text-ink-muted">Any GitHub account works; no university address needed.</p>
          {/* GitHubButton reads ?next= with useSearchParams, which needs a boundary. */}
          <Suspense>
            <GitHubButton />
          </Suspense>
          <OrDivider>or</OrDivider>
          <h2 className="mb-1 font-bold">With your institutional email</h2>
          <p className="mb-2 text-[0.95rem] text-ink-muted">We will send you a link to confirm the address.</p>
        </>
      ) : (
        <p className="mb-2 text-[0.98rem] text-ink-muted">
          Accounts are for researchers. Please sign up with the email address of your university or research
          institute. We will send you a link to confirm it.
        </p>
      )}
      <Suspense>
        <SignUpForm github={github} />
      </Suspense>
    </>
  );
}
