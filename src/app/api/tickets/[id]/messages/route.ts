import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ticket = await prisma.ticket.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messages = await prisma.ticketMessage.findMany({ where: { ticketId: params.id }, include: { user: { select: { name: true, image: true, role: true } } }, orderBy: { createdAt: "asc" } });
  return NextResponse.json({ success: true, data: messages });
}
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Nội dung trống" }, { status: 400 });
  const ticket = await prisma.ticket.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!ticket || ticket.status === "CLOSED") return NextResponse.json({ error: "Ticket không hợp lệ" }, { status: 400 });
  const msg = await prisma.ticketMessage.create({ data: { ticketId: params.id, userId: session.user.id, content: content.trim(), isAdmin: false }, include: { user: { select: { name: true, image: true, role: true } } } });
  await prisma.ticket.update({ where: { id: params.id }, data: { status: "OPEN", updatedAt: new Date() } });
  return NextResponse.json({ success: true, data: msg });
}
