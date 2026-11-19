import { handle, json, readBody } from "@/lib/api/http";
import { rateLimit } from "@/lib/auth/rate-limit";
import { createSessionToken, safeEqual, sessionCookie } from "@/lib/auth/session";
import { AppError, unauthorized } from "@/lib/blog/errors";
import { env } from "@/lib/env";
import { loginSchema } from "@/lib/blog/validation";

export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  const limit = rateLimit(`login:${ip}`, 8, 10 * 60_000);
  if (!limit.allowed) {
    const err = new AppError(429, "rate_limited", `Too many login attempts. Try again in ${limit.retryAfterSeconds}s.`, {
      retryAfterSeconds: limit.retryAfterSeconds,
    });
    const res = Response.json({ error: { code: err.code, message: err.message, details: err.details } }, { status: 429 });
    res.headers.set("Retry-After", String(limit.retryAfterSeconds));
    return res;
  }
  const { password } = await readBody(req, loginSchema);
  const expected = env.adminPassword;
  const token = await createSessionToken();
  if (!expected || !token) throw new AppError(503, "unavailable", "Admin login is not configured (set ADMIN_PASSWORD and SESSION_SECRET)");
  if (!(await safeEqual(password, expected))) throw unauthorized("Incorrect password");
  return json({ authenticated: true }, { headers: { "Set-Cookie": sessionCookie(token), "Cache-Control": "no-store" } });
});
