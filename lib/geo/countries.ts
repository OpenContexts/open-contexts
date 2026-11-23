// The country of an institution, for the map of where contributors come from (/progress): from the university list
// (scripts/update-university-domains.ts), else from the domain itself. Approximate, as an address's domain is.
import "server-only";
import universityCountries from "./university-countries.json";

const UNIVERSITIES: Record<string, string> = universityCountries;

/** Research institutes whose domain names no country (lib/auth/institutional.ts lists them). */
const INSTITUTES: Record<string, string> = { "icfo.eu": "ES", "inl.int": "PT", "esa.int": "FR", "eso.org": "DE" };

/** Country-code top-level domains that are not the country's ISO code. */
const TLD_CODES: Record<string, string> = { uk: "GB" };

/**
 * The ISO 3166 alpha-2 code of the country of an institution, given as the domain that names it (institutionOf):
 * as the university list has it, as listed above, "US" for .edu and .gov, else by the country-code top-level domain
 * ("ox.ac.uk" → GB). Undefined when the domain names no country (.org, .eu, …).
 */
export function countryOf(institution: string): string | undefined {
  const domain = institution.toLowerCase();
  const known = UNIVERSITIES[domain] ?? INSTITUTES[domain];
  if (known) return known;
  const tld = domain.split(".").at(-1)!;
  if (tld === "edu" || tld === "gov") return "US";
  if (tld.length === 2 && tld !== "eu") return TLD_CODES[tld] ?? tld.toUpperCase();
  return undefined;
}
