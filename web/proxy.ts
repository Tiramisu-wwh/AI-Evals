import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  getDefaultRouteForRole,
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/session";

const USER_ONLY_PATHS = ["/submit", "/my-submissions"];
const ADMIN_ONLY_PATHS = ["/admin"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const viewer = await verifySessionToken(token);

  if (pathname === "/login") {
    if (viewer) {
      return NextResponse.redirect(
        new URL(getDefaultRouteForRole(viewer.role), request.url),
      );
    }

    return NextResponse.next();
  }

  if (!viewer) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (viewer.role === "user" && matchesPrefix(pathname, ADMIN_ONLY_PATHS)) {
    return NextResponse.redirect(new URL("/submit", request.url));
  }

  if (viewer.role === "admin" && matchesPrefix(pathname, USER_ONLY_PATHS)) {
    return NextResponse.redirect(new URL("/admin/submissions", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(getDefaultRouteForRole(viewer.role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
};
