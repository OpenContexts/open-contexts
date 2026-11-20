import Link from "next/link";
import { isPlaceholderEmail } from "@/lib/auth/orcid";
import { getCurrentUser, isModerator } from "@/lib/auth/session";
import { getPendingCounts } from "@/lib/data/moderation";
import { countNews } from "@/lib/data/submissions";
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
  const moderator = isModerator(user);
  const [news, pending] = await Promise.all([countNews(user.id), moderator ? getPendingCounts() : null]);
  // For moderators, everything waiting for a decision: unlike their news, it stays until someone decides it.
  const toReview = pending ? Object.values(pending).reduce((a, b) => a + b, 0) : 0;
  return <AccountMenu name={user.name} email={email} moderator={moderator} news={news} toReview={toReview} />;
}
