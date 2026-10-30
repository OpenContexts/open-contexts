import type { Metadata } from "next";
import { PageTitle } from "@/components/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="prose-oc">
      <PageTitle>About</PageTitle>
      <p>
        {SITE.name} is a community-curated database of open problems in theoretical physics. Each problem is
        stated precisely, placed in its context in the literature, and given a dated status. Progress is recorded
        with credit to the people who made it.
      </p>
      <p>TODO: mission, moderators, how to cite, license.</p>
    </div>
  );
}
