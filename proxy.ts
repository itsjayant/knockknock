import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js 16 Proxy (previously called Middleware) — lightweight cookie presence check.
 * Strong verification (token validity) happens server-side in lib/auth.ts.
 */
export function proxy(request: NextRequest) {
  const session = request.cookies.get("__session");
  if (!session?.value) {
    const loginUrl = new URL("/login", request.url);
    // Preserve the intended destination so we can redirect back after sign-in
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  // Protect all homeowner routes (route group folders are transparent in URLs)
  matcher: ["/dashboard/:path*", "/qr-codes/:path*"],
};
