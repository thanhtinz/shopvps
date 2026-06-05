import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findFirst({
    where: { ownerId: session.user.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });
  return NextResponse.json({ success: true, data: team });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Tên team không được trống" }, { status: 400 });

  const existing = await prisma.team.findFirst({ where: { ownerId: session.user.id } });
  if (existing) return NextResponse.json({ error: "Bạn đã có team" }, { status: 400 });

  const team = await prisma.team.create({ data: { name: name.trim(), ownerId: session.user.id } });
  return NextResponse.json({ success: true, data: team });
}
