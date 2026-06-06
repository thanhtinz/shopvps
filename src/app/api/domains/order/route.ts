import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveTld, isValidDomain } from "@/lib/domains";
import { getRegistrar } from "@/lib/registrars";
import { getSettings, isFlagOn } from "@/lib/settings";
import { getServerT, getUserT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isFlagOn("sell_domain"))) return NextResponse.json({ error: t("Sản phẩm hiện không được bán") }, { status: 400 });

  const { domain: rawDomain, years: rawYears, nameservers, authCode, type } = await req.json();
  const domain = String(rawDomain || "").toLowerCase().trim();
  const years = Math.max(1, Math.min(10, parseInt(rawYears) || 1));
  const kind = type === "transfer" ? "transfer" : "register";

  if (!isValidDomain(domain)) return NextResponse.json({ error: t("Tên miền không hợp lệ") }, { status: 400 });
  const tld = await resolveTld(domain);
  if (!tld) return NextResponse.json({ error: t("Đuôi tên miền không được hỗ trợ") }, { status: 400 });

  const taken = await prisma.domainOrder.findFirst({ where: { domain, status: { in: ["ACTIVE", "PENDING"] } } });
  if (taken) return NextResponse.json({ error: t("Tên miền đã được đăng ký trong hệ thống") }, { status: 400 });

  const unit = kind === "transfer" ? Number(tld.transferPrice) : Number(tld.registerPrice);
  const price = unit * years;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { status: true } });
  if (user && user.status !== "ACTIVE") return NextResponse.json({ error: t("Tài khoản đã bị khoá") }, { status: 403 });

  try {
    const order = await prisma.$transaction(async (tx: any) => {
      const charged = await tx.user.updateMany({ where: { id: session.user.id, balance: { gte: price } }, data: { balance: { decrement: price } } });
      if (charged.count === 0) throw new Error("INSUFFICIENT_BALANCE");
      const fresh = await tx.user.findUnique({ where: { id: session.user.id }, select: { balance: true } });
      const balanceAfter = Number(fresh!.balance);

      const created = await tx.domainOrder.create({
        data: {
          userId: session.user.id, domain, tld: tld.tld, type: kind, status: "PENDING",
          registrar: "manual", years, price,
          nameservers: typeof nameservers === "string" && nameservers.trim() ? nameservers.trim() : null,
          authCode: kind === "transfer" && authCode ? String(authCode) : null,
        },
      });

      const { t: tn } = await getUserT(session.user.id);
      await tx.transaction.create({
        data: {
          userId: session.user.id, type: "PURCHASE", amount: price,
          balanceBefore: balanceAfter + price, balanceAfter,
          description: `${kind === "transfer" ? "Transfer" : tn("Đăng ký")} ${tn("tên miền")} ${domain} (${years} ${tn("năm")})`,
          status: "COMPLETED", reference: `DOMAIN-${created.id}`,
        },
      });
      return created;
    });

    // Auto-provision via the configured registrar (best-effort). Registration
    // activates the domain; transfers are accepted and complete asynchronously.
    // With no registrar configured the order stays PENDING for manual handling.
    let registered = false;
    try {
      const registrar = await getRegistrar();
      if (registrar) {
        const code = (await getSettings(["registrar"])).registrar || "manual";
        const ns = order.nameservers ? order.nameservers.split(",").map((x: string) => x.trim()).filter(Boolean) : undefined;
        if (kind === "register") {
          const r = await registrar.register(domain, years, ns);
          if (r.ok) {
            await prisma.domainOrder.update({ where: { id: order.id }, data: { status: "ACTIVE", registrar: code, registeredAt: new Date(), expiresAt: r.expiresAt ?? null } });
            registered = true;
          }
        } else {
          const r = await registrar.transfer(domain, years, order.authCode || "");
          if (r.ok) await prisma.domainOrder.update({ where: { id: order.id }, data: { registrar: code } });
        }
      }
    } catch (e) {
      console.error("domain registrar provisioning error:", e);
    }

    return NextResponse.json({
      success: true,
      data: order,
      message: registered ? t("Tên miền đã được đăng ký thành công.") : t("Đơn tên miền đã được tạo, đang chờ xử lý."),
    });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: t("Số dư không đủ. Vui lòng nạp thêm.") }, { status: 400 });
    console.error("domain order error:", e);
    return NextResponse.json({ error: t("Không thể tạo đơn tên miền") }, { status: 500 });
  }
}
