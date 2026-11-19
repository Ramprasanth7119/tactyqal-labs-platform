import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll } from "vitest";

export const API_KEY = "test-api-key";

/** Point the app at a fresh temp SQLite file (migrations run automatically on first use). */
export function setupTempDb() {
  let dir = "";
  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "tq-blog-"));
    process.env.DATABASE_URL = `file:${path.join(dir, "test.db").replace(/\\/g, "/")}`;
    process.env.AUTO_SEED = "false";
    process.env.ADMIN_API_KEY = API_KEY;
    process.env.ADMIN_PASSWORD = "pw-for-tests";
    process.env.SESSION_SECRET = "test-session-secret-at-least-32-characters-long";
  });
  afterAll(async () => {
    const { closeDb } = await import("@/lib/db/client");
    closeDb();
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    } catch {
      /* Windows may keep the sqlite file locked briefly; the OS temp dir is cleaned up later */
    }
  });
}

type Handler = (req: Request, ctx: never) => Promise<Response>;

export async function call(
  handler: Handler,
  method: string,
  url: string,
  opts: { body?: unknown; auth?: boolean | string; params?: Record<string, string>; headers?: Record<string, string> } = {},
) {
  const headers: Record<string, string> = { ...opts.headers };
  if (opts.auth === true) headers.authorization = `Bearer ${API_KEY}`;
  else if (typeof opts.auth === "string") headers.authorization = opts.auth;
  if (opts.body !== undefined) headers["content-type"] = "application/json";
  const req = new Request(`http://localhost${url}`, {
    method,
    headers,
    body: opts.body === undefined ? undefined : typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body),
  });
  const res = await (handler as unknown as (r: Request, c: unknown) => Promise<Response>)(req, {
    params: Promise.resolve(opts.params ?? {}),
  });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}
