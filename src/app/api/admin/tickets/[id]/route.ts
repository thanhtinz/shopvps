import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitTicketUpdate } from "@/lib/socket";
import { getServerT } from "@/lib/i18n/server";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { action } = await req.json();

  const status = action === "close" ? "CLOSED" : action === "reopen" ? "OPEN" : action === "progress" ? "IN_PROGRESS" : null;
  if (!status) return NextResponse.json({ error: t("Hành động không hợp lệ") }, { status: 400 });

  await prisma.ticket.update({ where: { id }, data: { status, updatedAt: new Date() } });
  emitTicketUpdate(id);
  return NextResponse.json({ success: true });
}
