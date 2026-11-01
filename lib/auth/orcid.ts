// ORCID sign-in (https://orcid.org/developer-tools), through Better Auth's generic OAuth plugin.
// ORCID identifies researchers but does not hand out email addresses, which Better Auth needs for every
// account. So the account takes the person's public, verified ORCID email if they have one, and otherwise a
// placeholder address that is never written to (see isPlaceholderEmail).
import "server-only";
import type { GenericOAuthConfig } from "better-auth/plugins";

/** ORCID sign-in is offered only when its client is configured. */
export function isOrcidConfigured(): boolean {
  return !!(process.env.ORCID_CLIENT_ID && process.env.ORCID_CLIENT_SECRET);
}

/** ORCID's sandbox (sandbox.orcid.org) for testing, with ORCID_SANDBOX=true. */
const host = () => (process.env.ORCID_SANDBOX === "true" ? "sandbox.orcid.org" : "orcid.org");

const PLACEHOLDER_DOMAIN = "orcid.invalid";

/** The address of an ORCID account without a public email: "0000-0002-1825-0097@orcid.invalid". */
export const isPlaceholderEmail = (email: string) => email.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`);

type OrcidUserInfo = { sub: string; name?: string | null; given_name?: string | null; family_name?: string | null };
type OrcidEmails = { email?: { email: string; verified?: boolean; primary?: boolean }[] };

/** The person's public, verified email on their ORCID record, preferring the primary one. */
async function publicEmail(orcid: string): Promise<string | undefined> {
  try {
    const response = await fetch(`https://pub.${host()}/v3.0/${orcid}/email`, { headers: { Accept: "application/json" } });
    if (!response.ok) return undefined;
    const emails = ((await response.json()) as OrcidEmails).email?.filter((e) => e.verified) ?? [];
    return (emails.find((e) => e.primary) ?? emails[0])?.email;
  } catch {
    return undefined;
  }
}

export function orcidProvider(): GenericOAuthConfig {
  return {
    providerId: "orcid",
    clientId: process.env.ORCID_CLIENT_ID!,
    clientSecret: process.env.ORCID_CLIENT_SECRET!,
    authorizationUrl: `https://${host()}/oauth/authorize`,
    tokenUrl: `https://${host()}/oauth/token`,
    scopes: ["openid"],
    // ORCID takes the client secret in the request body and does not document PKCE.
    authentication: "post",
    pkce: false,
    async getUserInfo(tokens) {
      const response = await fetch(`https://${host()}/oauth/userinfo`, { headers: { Authorization: `Bearer ${tokens.accessToken}` } });
      if (!response.ok) return null;
      const info = (await response.json()) as OrcidUserInfo;
      if (!info.sub) return null;
      const email = await publicEmail(info.sub);
      const name = info.name?.trim() || [info.given_name, info.family_name].filter(Boolean).join(" ").trim() || info.sub;
      return {
        id: info.sub,
        name,
        email: email ?? `${info.sub}@${PLACEHOLDER_DOMAIN}`,
        // ORCID verified the public address; the placeholder needs no confirmation because nothing is sent to it.
        emailVerified: true,
      };
    },
  };
}
