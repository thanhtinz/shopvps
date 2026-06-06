import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orders = await prisma.sslOrder.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, include: { plan: true } });
  return NextResponse.json({ success: true, data: orders });
}
