"use server";

import { cacheLife, cacheTag } from "next/cache";
import { getProblems, searchProblems } from "@/lib/data/problems";

/** Ids of the problems matching a search, for the problem list. Cached per query until a problem changes. */
export async function searchProblemIds(query: string): Promise<string[]> {
  return matchingIds(query.trim().toLowerCase().slice(0, 200));
}

async function matchingIds(query: string): Promise<string[]> {
  "use cache";
  cacheLife("max");
  cacheTag("problems");
  return searchProblems(await getProblems(), query).map((p) => p.id);
}
