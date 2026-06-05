import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const BYPASS = ["/_next", "/api/auth", "/api/setup", "/api/webhook", "/favicon.ico"];
const SETUP_ROUTE = "/setup";
const LICENSE_ERROR_ROUTE = "/license-error";
const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password", "/status", "/verify-email"];
const ADMIN_ROUTES = ["/admin"];

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

  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    const role = (session?.user as any)?.role;
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images|fonts|public).*)"],
};
