// Refresh the list of university email domains, and the country of each:  pnpm update-university-domains
// Source: https://github.com/Hipo/university-domains-list (MIT License).
import { writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE = "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";
const OUT = path.join(__dirname, "..", "lib", "auth", "university-domains.json");
/** Domain → ISO 3166 alpha-2 code, for the map of where contributors come from (lib/geo/countries.ts). */
const COUNTRIES_OUT = path.join(__dirname, "..", "lib", "geo", "university-countries.json");

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const universities = (await res.json()) as { domains: string[]; alpha_two_code: string | null }[];
  const domains = [...new Set(universities.flatMap((u) => u.domains.map((d) => d.trim().toLowerCase())))]
    .filter((d) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d))
    .sort();
  await writeFile(OUT, `${JSON.stringify(domains)}\n`);
  console.log(`Wrote ${domains.length} domains to ${path.relative(process.cwd(), OUT)}.`);

  // The first university to name a domain decides its country; sorted, so the file only changes with the data.
  const countries: Record<string, string> = {};
  for (const u of universities) {
    const code = u.alpha_two_code?.trim().toUpperCase();
    if (!code || !/^[A-Z]{2}$/.test(code)) continue;
    for (const d of u.domains) countries[d.trim().toLowerCase()] ??= code;
  }
  const sorted = Object.fromEntries(domains.filter((d) => countries[d]).map((d) => [d, countries[d]]));
  await writeFile(COUNTRIES_OUT, `${JSON.stringify(sorted)}\n`);
  console.log(`Wrote the countries of ${Object.keys(sorted).length} domains to ${path.relative(process.cwd(), COUNTRIES_OUT)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
