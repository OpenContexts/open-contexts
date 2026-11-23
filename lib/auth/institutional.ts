// Decides whether an email address belongs to a university or research institute.
// Only sign-ups are gated (see lib/auth/index.ts); existing accounts keep working.
import "server-only";
import universityDomains from "./university-domains.json";

const UNIVERSITY_DOMAINS = new Set<string>(universityDomains);

/** Research institutes that are not universities, so they are missing from the university list. */
const RESEARCH_DOMAINS = [
  "cern.ch",
  "mpg.de",
  "desy.de",
  "fz-juelich.de",
  "helmholtz.de",
  "perimeterinstitute.ca",
  "pitp.ca",
  "oeaw.ac.at",
  "iqoqi-vienna.at",
  "cnrs.fr",
  "cea.fr",
  "ihes.fr",
  "infn.it",
  "ictp.it",
  "icfo.eu",
  "inl.int",
  "cwi.nl",
  "nikhef.nl",
  "riken.jp",
  "kek.jp",
  "tifr.res.in",
  "fnal.gov",
  "lbl.gov",
  "anl.gov",
  "bnl.gov",
  "lanl.gov",
  "llnl.gov",
  "ornl.gov",
  "nist.gov",
  "nasa.gov",
  "esa.int",
  "eso.org",
];

/** Academic second-level conventions: example.ac.uk, example.edu.au, example.res.in, … */
const ACADEMIC_SUFFIX = /\.(edu|ac\.[a-z]{2}|edu\.[a-z]{2}|res\.in)$/;

function listFromEnv(name: string): string[] {
  return (process.env[name] ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/** The domain and every parent domain: "physik.uni-ulm.de" → ["physik.uni-ulm.de", "uni-ulm.de"]. */
function domainAndParents(domain: string): string[] {
  const labels = domain.split(".");
  return labels.slice(0, -1).map((_, i) => labels.slice(i).join("."));
}

export function isInstitutionalEmail(email: string): boolean {
  const address = email.trim().toLowerCase();
  if (listFromEnv("ALLOWED_EMAILS").includes(address)) return true;

  const domain = address.split("@")[1];
  if (!domain || !domain.includes(".")) return false;
  if (ACADEMIC_SUFFIX.test(domain)) return true;

  const extra = new Set([...RESEARCH_DOMAINS, ...listFromEnv("EXTRA_EMAIL_DOMAINS")]);
  return domainAndParents(domain).some((d) => UNIVERSITY_DOMAINS.has(d) || extra.has(d));
}

/**
 * The institution an address belongs to, as the domain that names it: the broadest listed one ("uni-ulm.de" for
 * "…@physik.uni-ulm.de"), or the name under an academic suffix ("ox.ac.uk"). Undefined for other addresses, also
 * those let in one by one (ALLOWED_EMAILS). For counting institutions; approximate, as one may have several domains.
 */
export function institutionOf(email: string): string | undefined {
  const domain = email.trim().toLowerCase().split("@")[1];
  if (!domain || !domain.includes(".")) return undefined;
  const extra = new Set([...RESEARCH_DOMAINS, ...listFromEnv("EXTRA_EMAIL_DOMAINS")]);
  const listed = domainAndParents(domain).findLast((d) => UNIVERSITY_DOMAINS.has(d) || extra.has(d));
  return listed ?? domain.match(/[a-z0-9-]+\.(?:edu|ac\.[a-z]{2}|edu\.[a-z]{2}|res\.in)$/)?.[0];
}
