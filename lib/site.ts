// Site-wide settings. Plain values only, safe to import anywhere.
export const SITE = {
  name: "OpenContexts",
  subtitle: "Open problems in generalized contextuality",
  description:
    "A community-curated, moderated database of precisely stated open problems in generalized contextuality, with recorded progress, discussion and fine-grained credit.",
  repo: "https://github.com/OpenContexts/open-contexts",
  contact: "rafael.wagner@uni-ulm.de",
  /** The companion paper that sets out the methodology. Pages link to it once `url` is set. */
  paper: {
    title: "Accelerating research through human-AI collaboration: A case study in quantum foundations",
    authors: "Wagner et al.",
    year: "2026",
    url: "",
    /** For its BibTeX entry on /about (paperBibtex). Fill in what is known; empty fields are left empty in the entry. */
    bibtex: {
      key: "wagner2026accelerating",
      /** BibTeX's author list: "Last, First and Last, First". */
      author: "",
      journal: "",
      volume: "",
      pages: "",
      doi: "",
      /** The arXiv number, e.g. "2601.01234". */
      eprint: "",
    },
  },
} as const;

export const NAV = [
  { href: "/problems", label: "Problems" },
  { href: "/agenda", label: "Agenda" },
  { href: "/progress", label: "Progress" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
] as const;
