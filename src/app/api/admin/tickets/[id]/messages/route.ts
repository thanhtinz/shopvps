import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitTicketUpdate } from "@/lib/socket";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const messages = await prisma.ticketMessage.findMany({
    where: { ticketId: id },
    include: { user: { select: { name: true, image: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ success: true, data: messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Nội dung trống" }, { status: 400 });

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Không tìm thấy ticket" }, { status: 404 });

  const msg = await prisma.ticketMessage.create({
    data: { ticketId: id, userId: session!.user.id, content: content.trim(), isAdmin: true },
    include: { user: { select: { name: true, image: true, role: true } } },
  });
  await prisma.ticket.update({ where: { id }, data: { status: "IN_PROGRESS", updatedAt: new Date() } });

  // Notify the ticket owner and push a live-update signal.
  await prisma.notification.create({
    data: { userId: ticket.userId, type: "INFO", title: "Phản hồi hỗ trợ mới", content: `Ticket "${ticket.subject}" có phản hồi từ admin.` },
  });
  emitTicketUpdate(id);

  return NextResponse.json({ success: true, data: msg });
}
