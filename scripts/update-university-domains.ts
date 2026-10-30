// Refresh the list of university email domains:  pnpm update-university-domains
// Source: https://github.com/Hipo/university-domains-list (MIT License).
import { writeFile } from "node:fs/promises";
import path from "node:path";

const SOURCE = "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json";
const OUT = path.join(__dirname, "..", "lib", "auth", "university-domains.json");

async function main() {
  const res = await fetch(SOURCE);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const universities = (await res.json()) as { domains: string[] }[];
  const domains = [...new Set(universities.flatMap((u) => u.domains.map((d) => d.trim().toLowerCase())))]
    .filter((d) => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(d))
    .sort();
  await writeFile(OUT, `${JSON.stringify(domains)}\n`);
  console.log(`Wrote ${domains.length} domains to ${path.relative(process.cwd(), OUT)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
