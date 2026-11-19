import { count } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { posts } from "@/lib/db/schema";
import { handle, json } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export const GET = handle(async () => {
  const db = await getDb();
  const [{ n }] = await db.select({ n: count() }).from(posts);
  return json({ status: "ok", database: "up", posts: n, time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
});
