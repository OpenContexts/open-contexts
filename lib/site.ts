// Site-wide settings. Plain values only, safe to import anywhere.
export const SITE = {
  name: "OpenContext",
  subtitle: "Open problems in generalized contextuality",
  description:
    "A community-curated, moderated database of precisely stated open problems in generalized contextuality, with recorded progress, discussion and fine-grained credit.",
  repo: "",
  contact: "rafael.wagner@uni-ulm.de",
  /** The companion paper that sets out the methodology. Pages link to it once `url` is set. */
  paper: {
    title: "Accelerating research through human-AI collaboration: A case study in quantum foundations",
    authors: "Wagner et al.",
    year: "2026",
    url: "",
  },
} as const;

export const NAV = [
  { href: "/problems", label: "Problems" },
  { href: "/agenda", label: "Agenda" },
  { href: "/progress", label: "Progress" },
  { href: "/guidelines", label: "Guidelines" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
] as const;
