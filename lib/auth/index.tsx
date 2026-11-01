import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { revalidateTag } from "next/cache";
import { MODERATOR_ROLES, type Role } from "@/lib/constants";
import { MODERATORS_TAG } from "@/lib/data/moderators";
import { db, schema } from "@/lib/db";
import { sendEmail } from "@/lib/email/send";
import ResetPassword from "@/emails/reset-password";
import VerifyEmail from "@/emails/verify-email";
import { isGitHubConfigured } from "./github";
import { isInstitutionalEmail } from "./institutional";
import { BLOCKED_MESSAGE, INSTITUTIONAL_EMAIL_ERROR, INSTITUTIONAL_EMAIL_MESSAGE } from "./institutional-messages";

const isListedModerator = (u: Record<string, unknown>) => MODERATOR_ROLES.includes(u.role as Role) && !u.banned;
/** The About page lists the moderators. Not updateTag: these hooks also run in route handlers. */
const moderatorsChanged = () => revalidateTag(MODERATORS_TAG, { expire: 0 });

const github = isGitHubConfigured()
  ? { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! }
  : undefined;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    // Proves the person owns the institutional address they signed up with.
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({ to: user.email, subject: "Reset your OpenContext password", template: <ResetPassword name={user.name} url={url} /> });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({ to: user.email, subject: "Confirm your email for OpenContext", template: <VerifyEmail name={user.name} url={url} /> });
    },
  },
  socialProviders: github ? { github } : {},
  // Changes made through Better Auth itself (its update-user endpoint, the admin plugin's set-role,
  // ban-user, …) rather than the dashboard's actions, which refresh the list themselves.
  databaseHooks: {
    user: {
      update: {
        after: async (u, context) => {
          if (isListedModerator(u) || context?.path?.startsWith("/admin/")) moderatorsChanged();
        },
      },
      delete: {
        after: async (u) => {
          if (isListedModerator(u)) moderatorsChanged();
        },
      },
    },
  },
  user: {
    // New email-and-password accounts need an institutional address. GitHub accounts may use any
    // email: the GitHub account itself identifies the person. Only account creation is checked,
    // so returning sign-ins and linking GitHub to an existing account are not affected.
    validateUserInfo: ({ user, source }) => {
      if (source.action !== "create-user") return;
      if (source.method === "oauth" && source.oauth?.providerId === "github") return;
      if (!user.email || !isInstitutionalEmail(user.email)) {
        return { error: INSTITUTIONAL_EMAIL_ERROR, errorDescription: INSTITUTIONAL_EMAIL_MESSAGE };
      }
    },
  },
  plugins: [
    // Adds `role`, `banned`, … to the user table and admin endpoints for user management.
    // Blocked users (banned = true) cannot sign in; see app/admin/users.
    admin({ defaultRole: "user", adminRoles: ["admin"], bannedUserMessage: BLOCKED_MESSAGE }),
    // Must stay last: lets server actions set auth cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
