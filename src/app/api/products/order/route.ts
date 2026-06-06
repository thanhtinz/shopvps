import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceNumber } from "@/lib/utils";
import { getTaxForUser, taxFromInclusive } from "@/lib/settings";
import { isGroupSellable, typeLabel } from "@/lib/products";
import { nextExpiry } from "@/lib/utils";
import { getUserTier, tierCyclePrice } from "@/lib/pricing";
import { getPanelConfig, panelCreateServer } from "@/lib/pterodactyl";
import { provisionGameVps } from "@/lib/game-provision";
import { resolveChoices } from "@/lib/config-options";
import { encrypt } from "@/lib/encrypt";
import { getServerT, getUserT } from "@/lib/i18n/server";

const CYCLE_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, billingCycle, label, config } = await req.json();
  const cycle = ["MONTHLY", "QUARTERLY", "SEMI_ANNUAL", "ANNUAL"].includes(billingCycle) ? billingCycle : "MONTHLY";
  if (!productId) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });

  const product = await prisma.product.findFirst({ where: { id: productId, isActive: true } });
  if (!product) return NextResponse.json({ error: t("Sản phẩm không tồn tại") }, { status: 404 });
  if (!(await isGroupSellable(product.group))) return NextResponse.json({ error: t("Sản phẩm hiện không được bán") }, { status: 400 });
  if (product.stock != null && product.stock <= 0) return NextResponse.json({ error: t("Sản phẩm đã hết hàng") }, { status: 400 });

  const months = CYCLE_MONTHS[cycle] || 1;

  // Optional game-server config: validate the game + selected modules and fold
  // the recurring module prices into the base.
  let normalizedConfig: any = config && typeof config === "object" ? { ...config } : undefined;
  let game: any = null;
  let gameMonthly = 0;
  const gameId = config?.gameId;
  if (gameId) {
    game = await prisma.game.findFirst({ where: { id: gameId, isActive: true } });
    if (!game) return NextResponse.json({ error: t("Game không hợp lệ") }, { status: 400 });
    const moduleIds: string[] = Array.isArray(config?.moduleIds) ? config.moduleIds : [];
    const mods = moduleIds.length ? await prisma.gameModule.findMany({ where: { id: { in: moduleIds }, isActive: true, OR: [{ gameId }, { gameId: null }] } }) : [];
    gameMonthly = mods.reduce((s, m) => s + Number(m.priceMonthly), 0);
    normalizedConfig = { gameId, moduleIds: mods.map((m) => m.id) };
  }

  // Configurable options (WHMCS-style add-ons), recurring like the base price.
  let optionsMonthly = 0;
  if (config && Array.isArray(config.options)) {
    try {
      const r = await resolveChoices(product.id, config.options);
      optionsMonthly = r.monthly;
      normalizedConfig = { ...(normalizedConfig || {}), options: r.choiceIds };
    } catch (e: any) {
      if (String(e?.message).startsWith("REQUIRED_OPTION")) return NextResponse.json({ error: t("Vui lòng chọn đầy đủ tuỳ chọn bắt buộc") }, { status: 400 });
      throw e;
    }
  }

  const tier = await getUserTier(session.user.id);
  const base = (await tierCyclePrice(tier, "product", product.id, Number(product.priceMonthly), product.priceYearly != null ? Number(product.priceYearly) : null, cycle)) + (gameMonthly + optionsMonthly) * months;
  const price = base + Number(product.setupFee || 0);
  const { rate } = await getTaxForUser(session.user.id);
  const tax = taxFromInclusive(price, rate);

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { status: true } });
  if (user && user.status !== "ACTIVE") return NextResponse.json({ error: t("Tài khoản đã bị khoá") }, { status: 403 });

  const manual = !product.autoActivate;
  const displayLabel = (typeof label === "string" && label.trim()) ? label.trim() : `${typeLabel(product.category)} ${product.name}`;

  try {
    const order = await prisma.$transaction(async (tx: any) => {
      const charged = await tx.user.updateMany({ where: { id: session.user.id, balance: { gte: price } }, data: { balance: { decrement: price } } });
      if (charged.count === 0) throw new Error("INSUFFICIENT_BALANCE");
      const fresh = await tx.user.findUnique({ where: { id: session.user.id }, select: { balance: true } });
      const balanceAfter = Number(fresh!.balance);

      const created = await tx.productOrder.create({
        data: {
          userId: session.user.id, productId: product.id, category: product.category, group: product.group,
          label: displayLabel, status: manual ? "PENDING" : "ACTIVE",
          billingCycle: cycle, price: base,
          config: normalizedConfig,
          startDate: new Date(), expiresAt: nextExpiry(null, months),
        },
      });

      if (product.stock != null) await tx.product.update({ where: { id: product.id }, data: { stock: { decrement: 1 } } });

      const invoiceNumber = generateInvoiceNumber();
      const invoice = await tx.invoice.create({
        data: {
          userId: session.user.id, invoiceNumber, subtotal: price, discount: 0, tax, total: price,
          status: "PAID", paidAt: new Date(),
          items: { create: { description: `${product.name} — ${displayLabel} (${cycle})`, quantity: 1, unitPrice: price, total: price, productOrderId: created.id } },
        },
      });

      const { t: tn } = await getUserT(session.user.id);
      await tx.transaction.create({
        data: {
          userId: session.user.id, type: "PURCHASE", amount: price,
          balanceBefore: balanceAfter + price, balanceAfter,
          description: `${tn("Mua")} ${product.name} — ${displayLabel}`, status: "COMPLETED", reference: invoiceNumber,
        },
      });
      return created;
    });

    // Auto-provision a game server: prefer the panel (container), else deploy a
    // real VPS that self-installs via cloud-init. Falls back to PENDING (manual).
    let provisioned = false;
    if (game) {
      try {
        const cfg = game.eggId ? await getPanelConfig() : null;
        if (cfg && game.eggId) {
          const srv = await panelCreateServer(cfg, { name: displayLabel.slice(0, 40), eggId: parseInt(game.eggId, 10), dockerImage: game.dockerImage || undefined, memory: game.minRam });
          await prisma.productOrder.update({
            where: { id: order.id },
            data: { status: "ACTIVE", data: { ...(normalizedConfig || {}), panelServerId: srv.id, panelIdentifier: srv.identifier, panelUrl: srv.url }, credentials: encrypt(`Panel: ${srv.url}`) },
          });
          provisioned = true;
        } else {
          const vps = await provisionGameVps(game, `${game.slug}-${order.id.slice(-6)}`);
          if (vps) {
            await prisma.productOrder.update({
              where: { id: order.id },
              data: { status: "ACTIVE", data: { ...(normalizedConfig || {}), providerVpsId: vps.providerVpsId, ipAddress: vps.ip }, credentials: encrypt(`IP: ${vps.ip}\nUser: root\nPassword: ${vps.password}`) },
            });
            provisioned = true;
          }
        }
      } catch (e) { console.error("game provision error:", e); }
    }

    return NextResponse.json({
      success: true, data: order,
      message: provisioned ? t("Đặt hàng thành công.") : manual ? t("Đặt hàng thành công, đang chờ kích hoạt.") : t("Đặt hàng thành công."),
    });
  } catch (e: any) {
    if (e?.message === "INSUFFICIENT_BALANCE") return NextResponse.json({ error: t("Số dư không đủ. Vui lòng nạp thêm.") }, { status: 400 });
    console.error("product order error:", e);
    return NextResponse.json({ error: t("Không thể tạo đơn hàng") }, { status: 500 });
  }
}
