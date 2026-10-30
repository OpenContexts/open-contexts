"use server";

import { isInstitutionalEmail } from "@/lib/auth/institutional";

/** Live hint for the sign-up form. The binding check runs again in Better Auth on sign-up. */
export async function checkInstitutionalEmail(email: string): Promise<boolean> {
  return isInstitutionalEmail(email);
}
