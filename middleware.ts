import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public access to login page, home page (which shows login), and auth API routes
  if (pathname === "/login" || pathname === "/" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check for Better Auth session cookie
  // Better Auth may use different cookie names, check common ones
  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("better-auth.sessionToken") ||
    request.cookies.get("session_token");

  // If no session cookie, redirect to login
  if (!sessionCookie || !sessionCookie.value) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
