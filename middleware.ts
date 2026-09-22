import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_CREDENTIALS, JURY_COOKIE, TEAM_COOKIE } from "./src/lib/config";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (token !== ADMIN_CREDENTIALS.username) {
      const url = new URL("/admin/login", request.url);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/jury")) {
    if (pathname === "/jury/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get(JURY_COOKIE)?.value;
    if (!token?.startsWith("jury:")) {
      const url = new URL("/jury/login", request.url);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/team")) {
    if (pathname === "/team/login") {
      return NextResponse.next();
    }
    const token = request.cookies.get(TEAM_COOKIE)?.value;
    if (!token?.startsWith("team:")) {
      const url = new URL("/team/login", request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/jury/:path*", "/team/:path*"],
};

