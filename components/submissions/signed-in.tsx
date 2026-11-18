"use client";

import { createContext, type ReactNode, use } from "react";

const SignedInContext = createContext<Promise<boolean> | null>(null);

/**
 * Around a page whose discussions are cached for everyone: whether this visitor is signed in, read on the server
 * with the rest of the request (see isSignedIn), for the reply and comment buttons inside to open the right
 * thing at once. A promise, so the page does not wait for it.
 */
export function SignedInProvider({ signedIn, children }: { signedIn: Promise<boolean>; children: ReactNode }) {
  return <SignedInContext value={signedIn}>{children}</SignedInContext>;
}

/** Whether the visitor is signed in; suspends until the page's session lookup is done, which it usually is. */
export function useSignedIn(): boolean {
  const signedIn = use(SignedInContext);
  if (!signedIn) throw new Error("useSignedIn must be used within a SignedInProvider");
  return use(signedIn);
}
