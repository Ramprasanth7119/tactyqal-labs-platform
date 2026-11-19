import { count } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { handle, json } from "@/lib/api/http";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(posts);
  // Which kind of store is serving data (no URL or credentials are exposed).
  const storage = env.isEphemeralDemoDb ? "ephemeral-demo" : env.databaseUrl.startsWith("file:") ? "local-file" : "remote-libsql";
  return json({ status: "ok", database: "up", storage, posts: n, time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
});
