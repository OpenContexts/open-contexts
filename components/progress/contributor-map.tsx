// Where the contributors come from (/progress): a world map without labels, each country red once a researcher
// from one of its institutions contributed, grey before. Drawn on the server from lib/geo/world-map.json
// (scripts/build-world-map.ts); pointing at a country shows its figures (MapHover).
import worldMap from "@/lib/geo/world-map.json";
import type { AssessmentFigures } from "@/lib/data/assessment";
import { plural } from "@/lib/format";
import { MapHover } from "./map-hover";

export function ContributorMap({ countries, unplaced }: Pick<AssessmentFigures, "countries" | "unplaced">) {
  const placed = Object.keys(countries).length;
  return (
    <figure>
      <MapHover>
        <svg viewBox={`0 0 ${worldMap.width} ${worldMap.height}`} className="block h-auto w-full" role="img" aria-label={`World map: contributors from ${plural(placed, "country", "countries")}`}>
          {worldMap.countries.map((c, i) => {
            const figures = c.code ? countries[c.code] : undefined;
            return (
              <path
                key={i}
                d={c.d}
                data-name={c.name}
                data-figures={figures ? `${plural(figures.researchers, "researcher")} · ${plural(figures.institutions, "institution")}` : "No contributors yet"}
                className={figures ? "fill-brand-strong hover:fill-brand-dark" : "fill-rule-strong/70 hover:fill-ink-subtle"}
                strokeWidth={0.4}
                stroke="var(--color-paper)"
              />
            );
          })}
        </svg>
      </MapHover>
      <figcaption className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-ink-subtle">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-sm bg-brand-strong" /> Contributors from {plural(placed, "country", "countries")}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-3 rounded-sm bg-rule-strong/70" /> None yet
        </span>
        {unplaced > 0 && <span className="basis-full text-center">Not on the map: {plural(unplaced, "contributor")} whose country is not known.</span>}
      </figcaption>
    </figure>
  );
}
