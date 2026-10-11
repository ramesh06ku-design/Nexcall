import { NextResponse, type NextRequest } from "next/server";
import { dashboardForRole } from "@/lib/auth/routes";
import { getRequestUser } from "@/lib/auth/server-session";
import type { UserRole } from "@/types";

const AUTH_ROUTES = new Set(["/login", "/signup", "/worker-login"]);

function requiredRole(pathname: string): UserRole | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/agency")) return "agency";
  if (pathname.startsWith("/worker")) return "telecaller";
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const user = await getRequestUser(request);

  if (AUTH_ROUTES.has(pathname)) {
    return user
      ? NextResponse.redirect(new URL(dashboardForRole[user.role], request.url))
      : NextResponse.next();
  }

  const expectedRole = requiredRole(pathname);
  if (!expectedRole) return NextResponse.next();
  if (!user) {
    return NextResponse.redirect(
      new URL(expectedRole === "telecaller" ? "/worker-login" : "/login", request.url),
    );
  }
  if (user.role !== expectedRole) {
    return NextResponse.redirect(new URL(dashboardForRole[user.role], request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/worker-login",
    "/admin/:path*",
    "/agency/:path*",
    "/worker/:path*",
  ],
};
