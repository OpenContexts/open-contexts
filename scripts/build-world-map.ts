// Draw the world map of /progress once, as SVG paths:  pnpm build-world-map
// Source: Natural Earth 1:50m country borders (public domain), via world-atlas (ISC); simplified so that the paths
// stay small, but every country, also the smallest, keeps a shape. Writes lib/geo/world-map.json, which is committed:
// the site itself needs none of the libraries used here.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { geoEqualEarth, geoPath } from "d3-geo";
import countries from "i18n-iso-countries";
import { feature } from "topojson-client";
import { presimplify, quantile, simplify } from "topojson-simplify";
import type { GeometryCollection, Topology } from "topojson-specification";

const SOURCE = path.join(__dirname, "..", "node_modules", "world-atlas", "countries-50m.json");
const OUT = path.join(__dirname, "..", "lib", "geo", "world-map.json");
const WIDTH = 1000;
const HEIGHT = 440;
/** Of the points, the share by importance below which they are dropped. */
const SIMPLIFY = 0.04;
/** Countries without an ISO number in the source. */
const NO_NUMBER: Record<string, string> = { Kosovo: "XK" };

async function main() {
  const topology = JSON.parse(await readFile(SOURCE, "utf8")) as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  const simple = presimplify(topology);
  const topo = simplify(simple, quantile(simple, SIMPLIFY)) as typeof topology;
  const shapes = feature(topo, topo.objects.countries).features.filter((f) => f.properties.name !== "Antarctica");
  // Equal Earth, cut below Antarctica's coast: areas in proportion, so no country looks bigger than it is.
  const projection = geoEqualEarth().fitExtent(
    [
      [0, 0],
      [WIDTH, HEIGHT],
    ],
    { type: "FeatureCollection", features: shapes },
  );
  const draw = geoPath(projection).digits(1);
  const list = shapes
    .map((f) => {
      const code = f.id !== undefined ? countries.numericToAlpha2(String(f.id)) : NO_NUMBER[f.properties.name];
      return { code: code ?? null, name: f.properties.name, d: draw(f) ?? "" };
    })
    .filter((c) => c.d)
    .sort((a, b) => a.name.localeCompare(b.name));
  await writeFile(OUT, `${JSON.stringify({ width: WIDTH, height: HEIGHT, countries: list })}\n`);
  const missing = list.filter((c) => !c.code).map((c) => c.name);
  console.log(`Wrote ${list.length} countries to ${path.relative(process.cwd(), OUT)}${missing.length ? `; without a code: ${missing.join(", ")}` : ""}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
