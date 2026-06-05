import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pick } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, name: true, email: true, image: true, twoFactorEnabled: true, emailVerified: true, createdAt: true, affiliateCode: true, company: true, phone: true, address: true, city: true, country: true, taxId: true } });
  return NextResponse.json({ success: true, data: user });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  // Whitelist only the user's own profile/billing fields — never role/balance/etc.
  const data = pick(body, ["name", "company", "phone", "address", "city", "country", "taxId"]);
  const user = await prisma.user.update({ where: { id: session.user.id }, data, select: { id: true, name: true, email: true } });
  return NextResponse.json({ success: true, data: user });
}
