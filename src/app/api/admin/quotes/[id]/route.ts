import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT, getUserT } from "@/lib/i18n/server";
import { queueEmail } from "@/lib/workers";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { status } = await req.json();
  const allowed = ["DRAFT", "SENT", "DECLINED", "EXPIRED"];
  if (!allowed.includes(status)) return NextResponse.json({ error: t("Yêu cầu không hợp lệ") }, { status: 400 });

  const quote = await prisma.quote.update({ where: { id }, data: { status }, include: { user: { select: { id: true, email: true } } } });

  if (status === "SENT" && quote.user?.email) {
    const { t: tn } = await getUserT(quote.userId);
    await prisma.notification.create({ data: { userId: quote.userId, type: "INFO", title: tn("Bạn có báo giá mới"), content: `${tn("Báo giá")} ${quote.quoteNumber}` } });
    await queueEmail(quote.user.email, `${tn("Báo giá")} ${quote.quoteNumber} - ShopVPS`,
      `<p>${tn("Bạn có một báo giá mới. Vui lòng đăng nhập để xem và phản hồi.")}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/quotes">${tn("Xem báo giá")}</a></p>`);
  }
  return NextResponse.json({ success: true, data: quote });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  await prisma.quoteItem.deleteMany({ where: { quoteId: id } });
  await prisma.quote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
