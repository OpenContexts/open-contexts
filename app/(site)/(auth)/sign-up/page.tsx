import type { Metadata } from "next";
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
      <p className="mb-5 text-[0.98rem] text-ink-muted">
        Accounts are for researchers. Sign up with the email address of your university or research institute
        {github ? ", or with your GitHub account" : ""}. We will send you a link to confirm the address.
      </p>
      {github && <h2 className="mb-2 font-bold">With your institutional email</h2>}
      <SignUpForm
        github={github}
        alternative={
          github && (
            <>
              <OrDivider>or</OrDivider>
              <h2 className="mb-1 font-bold">With GitHub</h2>
              <p className="mb-3 text-[0.95rem] text-ink-muted">Any GitHub account works; no university address needed.</p>
              <GitHubButton />
            </>
          )
        }
      />
    </>
  );
}
