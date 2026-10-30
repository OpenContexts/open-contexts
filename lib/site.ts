// Site-wide settings. Plain values only, safe to import anywhere.
export const SITE = {
  name: "OpenContext",
  subtitle: "Open problems in theoretical physics",
  description:
    "A community-curated, moderated database of precisely stated open problems in theoretical physics, with recorded progress, discussion and fine-grained credit.",
  repo: "",
  contact: "",
} as const;

export const NAV = [
  { href: "/problems", label: "Problems" },
  { href: "/areas", label: "Areas" },
  { href: "/progress", label: "Progress" },
  { href: "/guidelines", label: "Guidelines" },
  { href: "/about", label: "About" },
  { href: "/contribute", label: "Contribute" },
] as const;
