import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session";

/** Gate /admin behind the signed session cookie. The API enforces its own auth independently. */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === "/admin/login") {
    if (authed) return NextResponse.redirect(new URL("/admin", req.url));
    return NextResponse.next();
  }
  if (!authed) {
    const url = new URL("/admin/login", req.url);
    if (pathname !== "/admin") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin", "/admin/:path*"] };
