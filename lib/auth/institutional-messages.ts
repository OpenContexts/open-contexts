// Auth messages. Kept apart from institutional.ts so client components can import the texts
// without pulling the ~130 KB domain list into the browser bundle.
export const INSTITUTIONAL_EMAIL_ERROR = "institutional_email_required";
export const INSTITUTIONAL_EMAIL_MESSAGE =
  "Please use the email address of your university or research institute. If your institution is not recognized, contact the moderators.";

export const BLOCKED_MESSAGE = "This account has been blocked. If you think this is a mistake, please contact the moderators.";
