import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// The signed-in user's own API keys (full key — they own it) for reseller use.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const keys = await prisma.apiKey.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, select: { id: true, name: true, key: true, isActive: true, lastUsedAt: true, createdAt: true } });
  return NextResponse.json({ success: true, data: keys });
}
