import Link from "next/link";
import { getCurrentUser, isModerator } from "@/lib/auth/session";
import { AccountMenu } from "./account-menu";

/** Reads the session, so render it inside <Suspense> (see SiteHeader). */
export async function UserMenu() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <Link href="/sign-in" className="text-ink hover:underline">
        Sign in
      </Link>
    );
  }
  return <AccountMenu name={user.name} email={user.email} moderator={isModerator(user)} />;
}
