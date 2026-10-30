import type { Metadata } from "next";
import { PageTitle, SectionTitle } from "@/components/ui";

export const metadata: Metadata = { title: "Guidelines" };

export default function GuidelinesPage() {
  return (
    <div className="prose-oc">
      <PageTitle>Guidelines</PageTitle>
      <SectionTitle>Moderation</SectionTitle>
      <p>
        Every comment, contribution, related link and suggested edit is reviewed by a moderator before it
        appears on the site. Moderators can accept or reject a submission and may leave a note explaining the
        decision. Each decision is logged.
      </p>
      <SectionTitle>What makes a good contribution</SectionTitle>
      <p>TODO: standards for statements, partial results, verifications, AI-use disclosure, citations.</p>
    </div>
  );
}
