import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }
export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const orders = await prisma.sslOrder.findMany({ orderBy: { createdAt: "desc" }, include: { plan: true, user: { select: { email: true, name: true } } }, take: 200 });
  return NextResponse.json({ success: true, data: orders });
}
