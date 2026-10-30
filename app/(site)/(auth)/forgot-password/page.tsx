import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <PageTitle>Forgot password</PageTitle>
      <p className="mb-2 text-[0.98rem] text-ink-muted">
        Enter the email address of your account and we will send you a link to choose a new password.
      </p>
      <ForgotPasswordForm />
    </>
  );
}
