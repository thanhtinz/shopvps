import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ticket = await prisma.ticket.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!ticket) return NextResponse.json({ error: "Ticket không tồn tại" }, { status: 404 });
  await prisma.ticket.update({ where: { id: params.id }, data: { status: "CLOSED" } });
  return NextResponse.json({ success: true });
}
