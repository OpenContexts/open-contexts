import { ActionButton } from "./components/action-button";
import { EmailLayout, Paragraph } from "./components/email-layout";

export type ResetPasswordProps = { name: string; url: string };

export default function ResetPassword({ name, url }: ResetPasswordProps) {
  return (
    <EmailLayout preview="Reset your OpenContext password">
      <Paragraph>Hello {name},</Paragraph>
      <Paragraph>Someone asked to reset the password of your OpenContext account. Choose a new one with the link below.</Paragraph>
      <ActionButton href={url}>Choose a new password</ActionButton>
      <Paragraph muted>The link is valid for one hour. If you did not ask for this, you can ignore this email; your password stays the same.</Paragraph>
    </EmailLayout>
  );
}

ResetPassword.PreviewProps = { name: "Ada Lovelace", url: "http://localhost:3000/api/auth/reset-password/example?callbackURL=%2Freset-password" } satisfies ResetPasswordProps;
