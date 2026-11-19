import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { count } from "drizzle-orm";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { env } from "@/lib/env";
import * as schema from "./schema";

export type Db = LibSQLDatabase<typeof schema>;

type State = {
  client: Client;
  db: Db;
  url: string;
  migrated: Promise<void>;
  ready: Promise<void>;
  seeding: boolean;
};
const g = globalThis as unknown as { __tqDb?: State };

function open(): State {
  const url = env.databaseUrl;
  if (url.startsWith("file:")) {
    const file = url.slice(5).replace(/^\/\//, "");
    if (file && file !== ":memory:") fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  }
  const client = createClient({ url, authToken: env.databaseAuthToken });
  const db = drizzle(client, { schema });
  const state = { client, db, url, seeding: false } as unknown as State;
  state.migrated = runMigrations(db);
  // Migrate, then (development only by default) seed an empty database on first run.
  state.ready = (async () => {
    await state.migrated;
    const autoSeed = process.env.AUTO_SEED ?? (process.env.NODE_ENV === "development" ? "true" : "false");
    if (autoSeed !== "true") return;
    const [{ n }] = await db.select({ n: count() }).from(schema.posts);
    if (n > 0) return;
    state.seeding = true; // the seeder itself calls getDb(); it must not wait on this promise
    try {
      const { seedDatabase } = await import("@/lib/blog/seed");
      await seedDatabase();
    } finally {
      state.seeding = false;
    }
  })();
  state.ready.catch(() => undefined); // surfaced to callers via getDb()
  return state;
}

export async function runMigrations(db: Db) {
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
}

/** Lazily opens the database, migrates it, and returns the Drizzle instance. */
export async function getDb(): Promise<Db> {
  if (!g.__tqDb || g.__tqDb.url !== env.databaseUrl) g.__tqDb = open();
  const state = g.__tqDb;
  await (state.seeding ? state.migrated : state.ready);
  return state.db;
}

/** Raw handle without auto-seed/migrate side effects (scripts, tests). */
export function closeDb() {
  g.__tqDb?.client.close();
  g.__tqDb = undefined;
}
