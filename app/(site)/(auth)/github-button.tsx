"use client";

import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui";
import { signIn } from "@/lib/auth/client";
import { safeNext } from "./shared";

/** Signs in with GitHub, creating the account on first use. Errors come back to /sign-in as ?error=. */
export function GitHubButton({ children = "Continue with GitHub" }: { children?: React.ReactNode }) {
  return (
    <ProviderButton provider="github" name="GitHub">
      {children}
    </ProviderButton>
  );
}

/** Signs in with ORCID (lib/auth/orcid.ts), creating the account on first use. */
export function OrcidButton({ children = "Continue with ORCID" }: { children?: React.ReactNode }) {
  return (
    <ProviderButton provider="orcid" name="ORCID">
      {children}
    </ProviderButton>
  );
}

function ProviderButton({ provider, name, children }: { provider: "github" | "orcid"; name: string; children: React.ReactNode }) {
  const next = safeNext(useSearchParams().get("next"));
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="quiet"
      disabled={pending}
      className="w-full"
      onClick={() =>
        startTransition(async () => {
          await signIn.social({ provider, callbackURL: next, errorCallbackURL: "/sign-in" });
        })
      }
    >
      {pending ? `Redirecting to ${name}…` : children}
    </Button>
  );
}

/** A horizontal rule with a word in the middle. */
export function OrDivider({ children = "or" }: { children?: React.ReactNode }) {
  return (
    <p className="my-5 flex items-center gap-3 text-sm text-ink-subtle before:h-px before:flex-1 before:bg-rule after:h-px after:flex-1 after:bg-rule">
      {children}
    </p>
  );
}
