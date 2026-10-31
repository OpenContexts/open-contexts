import "server-only";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

let instance: Db | undefined;

function getDb(): Db {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.");
    }
    instance = drizzle(url, { schema });
  }
  return instance;
}

/**
 * Neon over HTTP: one round trip per query, no pool to manage, good for serverless.
 * The client is created on first use, so importing this module never requires the
 * env var (e.g. during `next build`). For atomic multi-statement writes use
 * `db.batch([...])`, which runs in a single transaction.
 */
export const db = new Proxy({} as Db, {
  get: (_, prop) => Reflect.get(getDb(), prop),
});

export { schema };

/** False when DATABASE_URL is missing. The cached problem reads then return nothing, so `next build` works without a database. */
export function isDbConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}
