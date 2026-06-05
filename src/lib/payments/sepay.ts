import { prisma } from "@/lib/prisma";
import { generateVietQRUrl } from "@/lib/sepay";
import { translate } from "@/lib/i18n/dictionaries";
import type { GatewayModule } from "./types";

// SePay auto bank transfer — reconciled by the existing /api/webhook/sepay
// handler, which matches the "SHOPVPS {userId}" transfer content. No pending
// transaction is pre-created here to avoid double-crediting.
export const sepayGateway: GatewayModule = {
  code: "sepay",
  label: "Chuyển khoản tự động (SePay)",
  auto: true,
  createsPendingTxn: false,
  async initiate(ctx) {
    const t = (k: string) => translate(ctx.locale, k);
    const bank = await prisma.bankAccount.findFirst({ where: { isActive: true, isPrimary: true } })
      || await prisma.bankAccount.findFirst({ where: { isActive: true } });
    const description = `SHOPVPS ${ctx.userId}`;
    const qrUrl = bank ? generateVietQRUrl({ bankCode: bank.bankCode, accountNumber: bank.accountNumber, accountName: bank.accountName, amount: ctx.amountBase, description }) : null;
    const lines = [
      { label: t("Ngân hàng"), value: bank ? `${bank.bankName} (${bank.bankCode})` : "—" },
      { label: t("Số tài khoản"), value: bank?.accountNumber || "—" },
      { label: t("Số tiền"), value: `${ctx.amountBase.toLocaleString("vi-VN")}đ` },
      { label: t("Nội dung CK"), value: description },
    ];
    return { kind: "instructions", title: t("Quét mã QR hoặc chuyển khoản"), lines, note: t("Tài khoản sẽ tự động được cộng tiền sau khi nhận chuyển khoản (vài giây)."), qrUrl };
  },
};
