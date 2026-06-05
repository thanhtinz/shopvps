import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";

export const VPS_PACKAGE_FIELDS = [
  "providerId", "name", "slug", "cpu", "ram", "storage", "bandwidth",
  "priceMonthly", "priceYearly", "isActive", "sortOrder", "features",
] as const;

async function isAdmin(session: any) { return session && ["ADMIN","SUPER_ADMIN"].includes((session.user as any).role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const packages = await prisma.vpsPackage.findMany({ include: { provider: true }, orderBy: [{ providerId: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json({ success: true, data: packages });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const pkg = await prisma.vpsPackage.create({ data: pick(body, VPS_PACKAGE_FIELDS) as any });
  return NextResponse.json({ success: true, data: pkg });
}
