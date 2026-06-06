import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidDomain } from "@/lib/domains";
import { tryAutoIssue } from "@/lib/ssl";
import { getServerT, getUserT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = await req.json();
  const commonName = String(b.commonName || "").toLowerCase().trim().replace(/^\*\./, "");
  if (!isValidDomain(commonName)) return NextResponse.json({ error: t("Tên miền không hợp lệ") }, { status: 400 });
  const plan = await prisma.sslPlan.findFirst({ where: { id: b.planId, isActive: true } });
  if (!plan) return NextResponse.json({ error: t("Gói SSL không tồn tại") }, { status: 404 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { status: true } });
  if (user && user.status !== "ACTIVE") return NextResponse.json({ error: t("Tài khoản đã bị khoá") }, { status: 403 });
  const price = Number(plan.price);
  const provider = (plan.brand || "").toLowerCase().includes("let") ? "letsencrypt" : "manual";

  try {
    const order = await prisma.$transaction(async (tx: any) => {
      const charged = await tx.user.updateMany({ where: { id: session.user.id, balance: { gte: price } }, data: { balance: { decrement: price } } });
      if (charged.count === 0) throw new Error("INSUFFICIENT_BALANCE");
      const fresh = await tx.user.findUnique({ where: { id: session.user.id }, select: { balance: true } });
      const balanceAfter = Number(fresh!.balance);
      const created = await tx.sslOrder.create({
        data: {
          userId: session.user.id, planId: plan.id, commonName, provider, type: plan.type,
          validationMethod: ["DNS", "HTTP", "EMAIL"].includes(b.validationMethod) ? b.validationMethod : "DNS",
          approverEmail: b.approverEmail || null, csr: b.csr || null, years: plan.years, price,
          status: "AWAITING_VALIDATION",
        },
      });
      const { t: tn } = await getUserT(session.user.id);
      await tx.transaction.create({ data: { userId: session.user.id, type: "PURCHASE", amount: price, balanceBefore: balanceAfter + price, balanceAfter, description: `${tn("Chứng chỉ SSL")} ${commonName} (${plan.name})`, status: "COMPLETED", reference: `SSL-${created.id}` } });
      return created;
    });

    // Best-effort auto-issue (no-op unless ACME is wired).
    let issued = false;
    try {
      const r = await tryAutoIssue({ commonName, provider });
      if (r) { await prisma.sslOrder.update({ where: { id: order.id }, data: { status: "ISSUED", certificate: r.certificate, caBundle: r.caBundle || null, issuedAt: new Date(), expiresAt: r.expiresAt } }); issued = true; }
    } catch (e) { console.error("ssl auto-issue error:", e); }

    return NextResponse.json({ success: true, data: order, message: issued ? t("Chứng chỉ đã được cấp.") : t("Đơn SSL đã tạo, đang chờ xác thực & cấp phát.") });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: t("Số dư không đủ. Vui lòng nạp thêm.") }, { status: 400 });
    console.error("ssl order error:", e);
    return NextResponse.json({ error: t("Không thể tạo đơn SSL") }, { status: 500 });
  }
}
