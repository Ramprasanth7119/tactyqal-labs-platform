import { env } from "@/lib/env";
import { unauthorized } from "@/lib/blog/errors";
import { readCookie, safeEqual, SESSION_COOKIE, verifySessionToken } from "./session";

/** Admin = `Authorization: Bearer <ADMIN_API_KEY>` OR a valid signed session cookie. */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const auth = req.headers.get("authorization");
  if (auth) {
    const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
    const key = env.adminApiKey;
    if (m && key && (await safeEqual(m[1], key))) return true;
  }
  const token = readCookie(req.headers.get("cookie"), SESSION_COOKIE);
  return verifySessionToken(token);
}

export async function requireAdmin(req: Request): Promise<void> {
  if (!(await isAdminRequest(req))) throw unauthorized("Provide a valid Bearer API key or sign in at /admin/login");
}
