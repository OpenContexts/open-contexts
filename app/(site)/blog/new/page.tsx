import type { Metadata } from "next";
import Link from "next/link";
import { PostForm } from "@/components/submissions/post-form";
import { SubmissionPage } from "@/components/submissions/submission-page";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Write a blog post", robots: { index: false } };

export default async function NewPostPage() {
  const user = await requireUser("/blog/new");
  return (
    <SubmissionPage
      back={{ href: "/blog", label: "Blog" }}
      title="Write a blog post"
      intro={
        <p>
          Write the post as it should appear on the site: a title, the names of its authors and the text, with
          references the text can cite. Use the <em>Preview</em> tab to check the formatting and the mathematics,
          and see the{" "}
          <Link href="/contribute#formatting" className="text-brand hover:underline">
            formatting summary
          </Link>{" "}
          for the details. It is published, dated the day of approval, once a moderator has approved it.
        </p>
      }
    >
      <PostForm defaultAuthors={user.name} />
    </SubmissionPage>
  );
}
