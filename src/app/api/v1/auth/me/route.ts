import { handle, json } from "@/lib/api/http";
import { isAdminRequest } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";

export const GET = handle(async (req) =>
  json({ authenticated: await isAdminRequest(req) }, { headers: { "Cache-Control": "private, no-store" } }),
);
