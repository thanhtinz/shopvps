import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { moduleForPath } from "@/lib/permissions";

const BYPASS = ["/_next", "/api/auth", "/api/setup", "/api/webhook", "/favicon.ico"];
const SETUP_ROUTE = "/setup";
const LICENSE_ERROR_ROUTE = "/license-error";
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/status", "/verify-email", "/faq", "/contact", "/terms", "/privacy"];

export default auth((req: any) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (BYPASS.some(p => pathname.startsWith(p))) return NextResponse.next();

  const licenseStatus = req.cookies.get("__ls")?.value;

  if (!licenseStatus || licenseStatus === "NOT_SETUP") {
    if (!pathname.startsWith(SETUP_ROUTE)) {
      return NextResponse.redirect(new URL(SETUP_ROUTE, req.url));
    }
    return NextResponse.next();
  }

  if (licenseStatus === "INVALID") {
    if (!pathname.startsWith(LICENSE_ERROR_ROUTE)) {
      return NextResponse.redirect(new URL(LICENSE_ERROR_ROUTE, req.url));
    }
    return NextResponse.next();
  }

  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r));
  if (isPublic) return NextResponse.next();

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin area: role gate + per-module staff RBAC (pages and APIs).
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminArea) {
    const role = (session?.user as any)?.role;
    const isApi = pathname.startsWith("/api/");
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return isApi ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (role !== "SUPER_ADMIN") {
      const seg = pathname.match(/^\/(?:api\/)?admin\/([^/?]+)/)?.[1];
      const mod = moduleForPath(pathname);
      const perms = (session?.user as any)?.adminPermissions || [];
      // staff RBAC management is SUPER_ADMIN only.
      const denied = seg === "staff" || (mod ? !(Array.isArray(perms) && perms.includes(mod)) : false);
      if (denied) {
        return isApi ? NextResponse.json({ error: "Forbidden" }, { status: 403 }) : NextResponse.redirect(new URL(`/admin?denied=${mod || seg}`, req.url));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts|public).*)"],
};
