import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ticket = await prisma.ticket.findFirst({ where: { id: (await params).id, userId: session.user.id } });
  if (!ticket) return NextResponse.json({ error: t("Ticket không tồn tại") }, { status: 404 });
  await prisma.ticket.update({ where: { id: (await params).id }, data: { status: "CLOSED" } });
  return NextResponse.json({ success: true });
}
