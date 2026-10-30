import "server-only";
import { render } from "@react-email/components";
import nodemailer, { type Transporter } from "nodemailer";
import type { ReactElement } from "react";

// Sends email over SMTP with nodemailer. Any SMTP account works: your university's mail
// server, a Gmail account with an app password, or a transactional provider. Configure it
// with SMTP_* and EMAIL_FROM (see .env.example).

let transporter: Transporter | undefined;

function getTransporter(): Transporter | undefined {
  const host = process.env.SMTP_HOST;
  if (!host) return undefined;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host,
      port,
      // 465 speaks TLS from the start; 587 and 25 upgrade with STARTTLS.
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
    });
  }
  return transporter;
}

/** Renders a react-email template (see emails/) to HTML and plain text, then sends it. */
export async function sendEmail({ to, subject, template }: { to: string; subject: string; template: ReactElement }): Promise<void> {
  const [html, text] = await Promise.all([render(template), render(template, { plainText: true })]);

  const smtp = getTransporter();
  if (!smtp) {
    // Without SMTP, development prints the email; production refuses rather than silently dropping it.
    if (process.env.NODE_ENV === "production") throw new Error("SMTP_HOST is not set, so no email can be sent.");
    console.info(`\n─── Email (not sent: SMTP_HOST is not set) ───\nTo: ${to}\nSubject: ${subject}\n\n${text}\n───\n`);
    return;
  }

  await smtp.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
}
