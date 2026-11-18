import { citationParts } from "@/lib/references";

/**
 * A citation with only its identifiers as links (a URL, a DOI, an arXiv number), see citationParts. `untrusted`:
 * written by users and not edited by moderators, so the links get no endorsement. `attach`: whether a link the
 * text does not contain goes on its journal reference (or all of it); off where the link is shown separately.
 */
export function CitationText({ text, url, untrusted, attach, newTab }: { text: string; url?: string | null; untrusted?: boolean; attach?: boolean; newTab?: boolean }) {
  return citationParts(text, url ?? undefined, { attach }).map((p, i) =>
    p.href ? (
      <a
        key={i}
        href={p.href}
        rel={untrusted ? "nofollow ugc noopener noreferrer" : "noopener noreferrer"}
        target={newTab ? "_blank" : undefined}
        className="break-words text-brand hover:underline"
      >
        {p.text}
      </a>
    ) : (
      p.text
    ),
  );
}
