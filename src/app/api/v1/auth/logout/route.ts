import { handle, json } from "@/lib/api/http";
import { clearSessionCookie } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const POST = handle(async () => json({ authenticated: false }, { headers: { "Set-Cookie": clearSessionCookie() } }));
