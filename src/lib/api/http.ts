import { ZodError, type ZodType } from "zod";
import { isAdminRequest } from "@/lib/auth/guard";
import { AppError, badRequest, invalid } from "@/lib/blog/errors";

type Meta = Record<string, unknown>;

export function json(data: unknown, init: { status?: number; meta?: Meta; headers?: Record<string, string> } = {}) {
  return Response.json(
    { data, meta: init.meta ?? {} },
    { status: init.status ?? 200, headers: init.headers },
  );
}

export function errorResponse(err: unknown): Response {
  if (err instanceof ZodError) {
    return errorResponse(invalid("Validation failed", formatIssues(err)));
  }
  if (err instanceof AppError) {
    const headers: Record<string, string> = {};
    if (err.status === 401) headers["WWW-Authenticate"] = 'Bearer realm="tactyqal-blog"';
    return Response.json(
      { error: { code: err.code, message: err.message, details: err.details ?? null } },
      { status: err.status, headers },
    );
  }
  console.error("[api] unhandled error", err);
  return Response.json({ error: { code: "internal", message: "Internal server error", details: null } }, { status: 500 });
}

export function formatIssues(err: ZodError) {
  return err.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

/** Wrap a route handler so thrown AppErrors/ZodErrors become the standard error envelope. */
export function handle<C = unknown>(fn: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function readBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("Request body must be valid JSON");
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) throw badRequest("Request body must be a JSON object");
  return schema.parse(body);
}

export function queryObject(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of new URL(req.url).searchParams) if (v !== "") out[k] = v;
  return out;
}

/** Public GETs are CDN-cacheable; anything requested with admin credentials never is. */
export async function cacheHeaders(req: Request): Promise<Record<string, string>> {
  const admin = await isAdminRequest(req);
  return {
    "Cache-Control": admin ? "private, no-store" : "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    Vary: "Authorization, Cookie",
  };
}

/** Parse `If-Match: "3"`, `W/"3"` or `3`. */
export function ifMatchVersion(req: Request): number | undefined {
  const raw = req.headers.get("if-match");
  if (!raw) return undefined;
  const m = /^(?:W\/)?"?(\d+)"?$/.exec(raw.trim());
  if (!m) throw badRequest("If-Match must be a post version like \"3\"");
  return Number(m[1]);
}
