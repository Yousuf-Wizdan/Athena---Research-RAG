import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("athena_session");
  const { pathname } = request.nextUrl;

  // Protect dashboard page and paper/thread API paths
  const isProtectedPath =
    pathname === "/" ||
    pathname.startsWith("/api/papers") ||
    pathname.startsWith("/api/threads");

  if (!sessionCookie && isProtectedPath) {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized. Please log in." }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Prevent logged-in users from seeing the login screen
  if (sessionCookie && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/api/papers/:path*", "/api/threads/:path*"],
};
