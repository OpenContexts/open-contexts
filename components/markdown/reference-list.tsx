import type { CitableReferences } from "@/components/markdown/markdown";
import { CitationText } from "@/components/markdown/citation-text";
import { ExpandableList, PartTitle } from "@/components/ui";

/**
 * The "References" part of a problem or blog post, numbered as the text cites them, with only the identifiers in
 * each citation as links (CitationText). Nothing when there are none.
 * `untrusted`: written by users and not edited by moderators (blog posts), so the links get no endorsement.
 */
export function ReferenceList({ references, untrusted }: { references: CitableReferences; untrusted?: boolean }) {
  if (!references.length) return null;
  return (
    <>
      <PartTitle>References</PartTitle>
      <ExpandableList limit={10} noun={["reference", "references"]} ordered className="list-decimal pl-6">
        {references.map((r) => (
          <li key={r.text} className="my-1.5">
            <CitationText text={r.text} url={r.url} untrusted={untrusted} />
          </li>
        ))}
      </ExpandableList>
    </>
  );
}
