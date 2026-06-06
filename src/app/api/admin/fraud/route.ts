import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const users = await prisma.user.findMany({
    where: { riskScore: { gt: 0 } },
    orderBy: { riskScore: "desc" }, take: 100,
    select: { id: true, name: true, email: true, status: true, riskScore: true, riskFlags: true, createdAt: true },
  });
  return NextResponse.json({ success: true, data: users });
}

// Clear a user's risk flags (mark reviewed) or ban them.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId, action } = await req.json();
  if (!userId) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  if (action === "ban") await prisma.user.update({ where: { id: userId }, data: { status: "BANNED" } });
  else await prisma.user.update({ where: { id: userId }, data: { riskScore: 0, riskFlags: undefined } });
  return NextResponse.json({ success: true });
}
