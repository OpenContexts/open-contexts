import Link from "next/link";
import { getCurrentUser, isModerator } from "@/lib/auth/session";

/** "Edit in dashboard", for moderators only. Reads the session, so render it inside <Suspense>. */
export async function ModeratorEditLink({ problemId }: { problemId: string }) {
  if (!isModerator(await getCurrentUser())) return null;
  return (
    <Link href={`/admin/problems/${problemId}`} className="text-brand hover:underline">
      Edit in dashboard
    </Link>
  );
}
