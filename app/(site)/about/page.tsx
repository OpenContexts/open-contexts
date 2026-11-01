import type { Metadata } from "next";
import { connection } from "next/server";
import { CopyBlock, PageTitle, SectionTitle } from "@/components/ui";
import { getModerators } from "@/lib/data/moderators";
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
        <p>TODO: mission.</p>

        <SectionTitle>How to cite</SectionTitle>
        <p>
          Every problem page has a <em>Cite this problem</em> button with a ready-made BibTeX entry carrying the
          problem’s title, the people who posed it, the address of its page, the date it was posed, its status, and
          the date it was last updated. To cite the database as a whole:
        </p>
      </div>
      <DatabaseCitation />

      <SectionTitle>Moderators</SectionTitle>
      <p className="mb-5 text-justify hyphens-auto max-sm:text-left">
        Every submission is reviewed by one of the moderators before it appears.
      </p>
      <ModeratorList />

      <div className="prose-oc">
        <SectionTitle>Licensing</SectionTitle>
        <p>Unless an entry says otherwise, the text of this database is released under CC BY 4.0. Quotations from the cited sources keep their original licenses.</p>
      </div>
    </>
  );
}

/** Part of the static page; rebuilt only when the moderators change (see lib/data/moderators.ts). */
async function ModeratorList() {
  const moderators = await getModerators();
  if (!moderators.length) return <p className="text-ink-muted">No moderators yet.</p>;

  return (
    // Ruled like a table in a paper: heavier lines above and below, a thin one under the header.
    <table className="w-full border-y-[1.5px] border-ink text-left">
      <thead className="border-b border-rule-strong font-sans text-[0.7rem] tracking-[0.12em] text-ink-subtle uppercase">
        <tr>
          <th className="py-2 pr-6 font-bold">Name</th>
          <th className="py-2 font-bold">Email</th>
        </tr>
      </thead>
      <tbody>
        {moderators.map((m) => (
          <tr key={m.email}>
            <td className="py-2 pr-6 align-top">{m.name}</td>
            <td className="py-2 align-top wrap-anywhere">
              {/* On narrow screens the address breaks after the @ rather than anywhere. */}
              <a href={`mailto:${m.email}`} className="text-brand hover:underline">
                {m.email.split("@")[0]}@<wbr />
                {m.email.split("@").slice(1).join("@")}
              </a>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
