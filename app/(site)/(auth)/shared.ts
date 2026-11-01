import { BLOCKED_MESSAGE, INSTITUTIONAL_EMAIL_ERROR, INSTITUTIONAL_EMAIL_MESSAGE } from "@/lib/auth/institutional-messages";

/** Only same-site paths, so `?next=` cannot redirect to another origin. */
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Friendly text for Better Auth error codes, including ones passed back in `?error=`. */
export function authErrorMessage(error: { code?: string; message?: string } | string | null | undefined): string | null {
  if (!error) return null;
  const code = (typeof error === "string" ? error : (error.code ?? "")).toUpperCase();
  switch (code) {
    case INSTITUTIONAL_EMAIL_ERROR.toUpperCase():
      return INSTITUTIONAL_EMAIL_MESSAGE;
    case "BANNED_USER":
      return BLOCKED_MESSAGE;
    case "INVALID_EMAIL_OR_PASSWORD":
      return "The email address or password is not correct.";
    case "EMAIL_NOT_VERIFIED":
      return "Please confirm your email address first. We have sent you a new confirmation link.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email address already exists. Sign in instead, or reset your password.";
    case "PASSWORD_TOO_SHORT":
      return "The password must be at least 8 characters long.";
    case "ACCOUNT_NOT_LINKED":
      return "An account with this email address already exists. Please sign in the way you signed up.";
    case "UNABLE_TO_GET_USER_INFO":
    case "INVALID_CODE":
      return "The sign-in could not be completed. Please try again.";
    case "INVALID_TOKEN":
      return "This link is invalid or has expired. Please request a new one.";
    default:
      return (typeof error === "string" ? null : error.message) || "Something went wrong. Please try again.";
  }
}
