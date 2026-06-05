import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveTld } from "@/lib/domains";
import { getServerT } from "@/lib/i18n/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const domain = await prisma.domainOrder.findFirst({ where: { id, userId: session.user.id } });
  if (!domain) return NextResponse.json({ error: t("Không tìm thấy tên miền") }, { status: 404 });

  if (body.action === "renew") {
    if (domain.status !== "ACTIVE") return NextResponse.json({ error: t("Chỉ gia hạn tên miền đang hoạt động") }, { status: 400 });
    const years = Math.max(1, Math.min(10, parseInt(body.years) || 1));
    const tld = await resolveTld(domain.domain);
    if (!tld) return NextResponse.json({ error: t("Không tìm thấy bảng giá TLD") }, { status: 400 });
    const price = Number(tld.renewPrice) * years;
    try {
      await prisma.$transaction(async (tx: any) => {
        const charged = await tx.user.updateMany({ where: { id: session.user.id, balance: { gte: price } }, data: { balance: { decrement: price } } });
        if (charged.count === 0) throw new Error("INSUFFICIENT_BALANCE");
        const fresh = await tx.user.findUnique({ where: { id: session.user.id }, select: { balance: true } });
        const balanceAfter = Number(fresh!.balance);
        const base = domain.expiresAt && domain.expiresAt > new Date() ? new Date(domain.expiresAt) : new Date();
        base.setFullYear(base.getFullYear() + years);
        await tx.domainOrder.update({ where: { id }, data: { expiresAt: base } });
        await tx.transaction.create({ data: { userId: session.user.id, type: "PURCHASE", amount: price, balanceBefore: balanceAfter + price, balanceAfter, description: `Gia hạn tên miền ${domain.domain} (${years} năm)`, status: "COMPLETED" } });
      });
      return NextResponse.json({ success: true });
    } catch (e: any) {
      if (e?.message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: t("Số dư không đủ") }, { status: 400 });
      return NextResponse.json({ error: t("Không thể gia hạn") }, { status: 500 });
    }
  }

  const data: any = {};
  if (typeof body.nameservers === "string") data.nameservers = body.nameservers.trim() || null;
  if (typeof body.autoRenew === "boolean") data.autoRenew = body.autoRenew;
  const updated = await prisma.domainOrder.update({ where: { id }, data });
  return NextResponse.json({ success: true, data: updated });
}
