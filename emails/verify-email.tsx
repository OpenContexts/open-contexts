import { ActionButton } from "./components/action-button";
import { EmailLayout, Paragraph } from "./components/email-layout";

export type VerifyEmailProps = { name: string; url: string };

export default function VerifyEmail({ name, url }: VerifyEmailProps) {
  return (
    <EmailLayout preview="Confirm your email address for OpenContext">
      <Paragraph>Hello {name},</Paragraph>
      <Paragraph>Please confirm your email address to finish creating your OpenContext account.</Paragraph>
      <ActionButton href={url}>Confirm email address</ActionButton>
      <Paragraph muted>The link is valid for one hour. If you did not sign up, you can ignore this email.</Paragraph>
    </EmailLayout>
  );
}

// Sample data for the react-email preview server (`pnpm email:dev`).
VerifyEmail.PreviewProps = { name: "Ada Lovelace", url: "http://localhost:3000/api/auth/verify-email?token=example" } satisfies VerifyEmailProps;
