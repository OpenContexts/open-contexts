import Link from "next/link";
import { isPlaceholderEmail } from "@/lib/auth/orcid";
import { getCurrentUser, isModerator } from "@/lib/auth/session";
import { AccountMenu } from "./account-menu";

export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/sign-in" className="text-ink hover:underline">
        Sign in
      </Link>
    );
  }
  // ORCID accounts without a public email have a placeholder address; show their ORCID iD instead.
  const email = isPlaceholderEmail(user.email) ? `ORCID ${user.email.split("@")[0]}` : user.email;
  return <AccountMenu name={user.name} email={email} moderator={isModerator(user)} />;
}
