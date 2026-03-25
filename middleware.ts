import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/discover", "/my-picks"];

export function middleware(request: NextRequest) {
  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get("pitchr_session")?.value;
  if (!token) {
    const url = new URL("/", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/discover/:path*", "/my-picks/:path*"],
};
