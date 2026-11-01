// Site-wide settings. Plain values only, safe to import anywhere.
export const SITE = {
  name: "OpenContext",
  subtitle: "Open problems in generalized contextuality",
  description:
    "A community-curated, moderated database of precisely stated open problems in generalized contextuality, with recorded progress, discussion and fine-grained credit.",
  repo: "",
  contact: "rafael.wagner@uni-ulm.de",
} as const;

export const NAV = [
  { href: "/problems", label: "Problems" },
  { href: "/areas", label: "Areas" },
  { href: "/progress", label: "Progress" },
  { href: "/guidelines", label: "Guidelines" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
] as const;
