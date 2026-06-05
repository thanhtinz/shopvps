import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { emitTicketUpdate } from "@/lib/socket";
import { queueEmail } from "@/lib/workers";
import { renderTemplate } from "@/lib/email-templates";
import { getServerT, getUserT } from "@/lib/i18n/server";
import { translate, Locale } from "@/lib/i18n/dictionaries";

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
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: t("Nội dung trống") }, { status: 400 });

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: t("Không tìm thấy ticket") }, { status: 404 });

  const msg = await prisma.ticketMessage.create({
    data: { ticketId: id, userId: session!.user.id, content: content.trim(), isAdmin: true },
    include: { user: { select: { name: true, image: true, role: true } } },
  });
  await prisma.ticket.update({ where: { id }, data: { status: "IN_PROGRESS", updatedAt: new Date() } });

  // Notify the ticket owner and push a live-update signal.
  const { t: tn } = await getUserT(ticket.userId);
  await prisma.notification.create({
    data: { userId: ticket.userId, type: "INFO", title: tn("Phản hồi hỗ trợ mới"), content: `Ticket "${ticket.subject}" ${tn("có phản hồi từ admin.")}` },
  });
  emitTicketUpdate(id);

  // Email the owner using the admin-editable template (best-effort).
  try {
    const owner = await prisma.user.findUnique({ where: { id: ticket.userId }, select: { email: true, name: true, locale: true } });
    if (owner?.email) {
      const rl = (owner.locale as Locale) || "vi";
      const tr = (k: string) => translate(rl, k);
      const vars = { name: owner.name || "", subject: ticket.subject, ticketUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/tickets` };
      const tpl = await renderTemplate("ticket_reply", vars, rl);
      await queueEmail(owner.email, tpl?.subject || `${tr("[ShopVPS] Phản hồi cho ticket:")} ${ticket.subject}`, tpl?.html || `<p>Ticket "${ticket.subject}" ${tr("của bạn có phản hồi mới.")}</p>`);
    }
  } catch {}

  return NextResponse.json({ success: true, data: msg });
}
