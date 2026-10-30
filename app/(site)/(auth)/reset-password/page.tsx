import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <PageTitle>Choose a new password</PageTitle>
      {/* The token arrives as ?token= from the link in the email. */}
      <ResetPasswordForm />
    </>
  );
}
