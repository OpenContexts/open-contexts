import type { Metadata } from "next";
import Link from "next/link";
import { Address, Filled } from "@/components/legal/legal-parts";
import { PageTitle, SectionTitle } from "@/components/ui";
import { LEGAL, responsibleForContent } from "@/lib/legal";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "Legal notice (Impressum)" };

// The provider identification German law asks of every website (§ 5 DDG), and the person responsible for its
// edited content (§ 18 Abs. 2 MStV). The details are in lib/legal.ts.
export default function LegalNoticePage() {
  const { operator } = LEGAL;
  const responsible = responsibleForContent();
  return (
    <div className="prose-oc">
      <PageTitle>Legal notice (Impressum)</PageTitle>

      <SectionTitle>Provider</SectionTitle>
      <p>Information pursuant to § 5 DDG (German Digital Services Act):</p>
      <Address name={operator.name} address={operator.address} />

      <SectionTitle>Contact</SectionTitle>
      <p>
        Email: <a href={`mailto:${operator.email}`}>{operator.email}</a>
        <br />
        Phone: <Filled value={operator.phone} missing="phone number" />
      </p>

      <SectionTitle>Responsible for the content</SectionTitle>
      <p>Pursuant to § 18 Abs. 2 MStV (German Interstate Media Treaty):</p>
      <Address name={responsible.name} address={responsible.address} />

      <SectionTitle>Contributions by users</SectionTitle>
      <p>
        Comments, results, suggested edits, proposed problems and blog posts are written by the researchers credited
        with them, who are responsible for their content. The moderators review every submission before it appears
        (see <Link href="/contribute#how">how it works</Link>), but cannot guarantee that what it claims is correct.
        Statuses of problems are dated snapshots: check the cited sources before relying on one. If you find content
        on {SITE.name} that infringes your rights or the law, please write to{" "}
        <a href={`mailto:${operator.email}`}>{operator.email}</a>; we will remove it promptly once we know of it.
      </p>

      <SectionTitle>Links to other websites</SectionTitle>
      <p>
        {SITE.name} links to papers, preprints and other websites. Their providers are responsible for their
        content. We checked linked pages for apparent infringements when the link was added; we will remove a link
        promptly if we learn that the page it leads to breaks the law.
      </p>

      <SectionTitle>Privacy</SectionTitle>
      <p>
        How we handle personal data is described in the <Link href="/privacy">privacy policy</Link>.
      </p>
    </div>
  );
}
