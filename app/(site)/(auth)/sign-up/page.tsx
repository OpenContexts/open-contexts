import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { isGitHubConfigured } from "@/lib/auth/github";
import { isOrcidConfigured } from "@/lib/auth/orcid";
import { GitHubButton, OrcidButton, OrDivider } from "../github-button";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function SignUpPage() {
  const github = isGitHubConfigured();
  const orcid = isOrcidConfigured();
  // "ORCID", "GitHub", "ORCID or GitHub", or undefined when only email sign-up is offered.
  const others = [orcid && "ORCID", github && "GitHub"].filter((n): n is string => !!n).join(" or ") || undefined;
  return (
    <>
      <PageTitle>Create an account</PageTitle>
      <p className="mb-5 text-[0.98rem] text-ink-muted">
        Accounts are for researchers. Sign up with the email address of your university or research institute
        {others ? `, or with your ${others} account` : ""}. We will send you a link to confirm the address.
      </p>
      {others && <h2 className="mb-2 font-bold">With your institutional email</h2>}
      <SignUpForm
        alternativeNames={others}
        alternative={
          others && (
            <>
              <OrDivider>or</OrDivider>
              {orcid && (
                <>
                  <h2 className="mb-1 font-bold">With ORCID</h2>
                  <p className="mb-3 text-[0.95rem] text-ink-muted">Your ORCID iD identifies you; no university address needed.</p>
                  <OrcidButton />
                </>
              )}
              {github && (
                <>
                  <h2 className={orcid ? "mt-6 mb-1 font-bold" : "mb-1 font-bold"}>With GitHub</h2>
                  <p className="mb-3 text-[0.95rem] text-ink-muted">Any GitHub account works; no university address needed.</p>
                  <GitHubButton />
                </>
              )}
            </>
          )
        }
      />
    </>
  );
}
