import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT, getUserT } from "@/lib/i18n/server";
import { generateQuoteNumber, quoteTotals } from "@/lib/quotes";
import { queueEmail } from "@/lib/workers";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const quotes = await prisma.quote.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } }, items: true },
  });
  return NextResponse.json({ success: true, data: quotes });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { userId, title, items, discount, validUntil, notes, send } = await req.json();
  if (!userId || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  }
  const customer = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!customer) return NextResponse.json({ error: t("Người dùng không tồn tại") }, { status: 404 });

  const { lines, subtotal, discount: disc, tax, total } = await quoteTotals(items, discount, userId);
  if (lines.length === 0) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });

  const quote = await prisma.quote.create({
    data: {
      userId, title: title || null, status: send ? "SENT" : "DRAFT",
      subtotal, discount: disc, tax, total,
      validUntil: validUntil ? new Date(validUntil) : null,
      notes: notes || null,
      quoteNumber: generateQuoteNumber(),
      items: { create: lines },
    },
    include: { items: true },
  });

  if (send && customer.email) {
    const { t: tn } = await getUserT(userId);
    await prisma.notification.create({
      data: { userId, type: "INFO", title: tn("Bạn có báo giá mới"), content: `${tn("Báo giá")} ${quote.quoteNumber}` },
    });
    await queueEmail(customer.email, `${tn("Báo giá")} ${quote.quoteNumber} - ShopVPS`,
      `<p>${tn("Bạn có một báo giá mới. Vui lòng đăng nhập để xem và phản hồi.")}</p>
       <p><a href="${process.env.NEXT_PUBLIC_APP_URL || ""}/quotes">${tn("Xem báo giá")}</a></p>`);
  }

  return NextResponse.json({ success: true, data: quote });
}
