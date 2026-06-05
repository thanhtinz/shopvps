import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tickets = await prisma.ticket.findMany({ where: { userId: session.user.id }, include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ success: true, data: tickets });
}
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subject, priority, department, content } = await req.json();
  if (!subject || !content) return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });
  const ticket = await prisma.ticket.create({ data: { userId: session.user.id, subject, priority: priority || "MEDIUM", department, messages: { create: { userId: session.user.id, content, isAdmin: false } } }, include: { messages: true } });
  return NextResponse.json({ success: true, data: ticket });
}
