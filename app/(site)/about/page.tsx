import type { Metadata } from "next";
import { connection } from "next/server";
import { CopyBlock, PageTitle, SectionTitle } from "@/components/ui";
import { databaseBibtex, databaseCitation, siteOrigin, todayIso } from "@/lib/cite";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <>
      <div className="prose-oc">
        <PageTitle>About</PageTitle>
        <p>
          {SITE.name} is a community-curated database of open problems in theoretical physics. Each problem is
          stated precisely, placed in its context in the literature, and given a dated status. Progress is recorded
          with credit to the people who made it.
        </p>
        <p>TODO: mission, moderators, license.</p>

        <SectionTitle>How to cite</SectionTitle>
        <p>
          Every problem page has a <em>Cite this problem</em> button with a ready-made BibTeX entry carrying the
          problem’s title, the people who posed it, the address of its page, the date it was posed, its status, and
          the date it was last updated. To cite the database as a whole:
        </p>
      </div>
      
        <SectionTitle>Moderators</SectionTitle>
        
      <DatabaseCitation />
    </>
  );
}

/** Rendered per request: both citations carry today's date as the date of access. */
async function DatabaseCitation() {
  await connection();
  const context = { origin: siteOrigin(), today: todayIso() };
  return (
    <div className="mt-4 space-y-4">
      <CopyBlock label="Plain text" text={databaseCitation(context)} />
      <CopyBlock label="BibTeX" text={databaseBibtex(context)} />
    </div>
  );
}
