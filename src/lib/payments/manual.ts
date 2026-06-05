import { prisma } from "@/lib/prisma";
import { translate } from "@/lib/i18n/dictionaries";
import type { GatewayModule } from "./types";

// Manual bank transfer — admin confirms the deposit after seeing the money.
export const manualGateway: GatewayModule = {
  code: "manual",
  label: "Chuyển khoản ngân hàng (thủ công)",
  auto: false,
  createsPendingTxn: true,
  async initiate(ctx) {
    const t = (k: string) => translate(ctx.locale, k);
    const bank = await prisma.bankAccount.findFirst({ where: { isActive: true, isPrimary: true } })
      || await prisma.bankAccount.findFirst({ where: { isActive: true } });
    const lines = [
      { label: t("Ngân hàng"), value: bank ? `${bank.bankName} (${bank.bankCode})` : "—" },
      { label: t("Số tài khoản"), value: bank?.accountNumber || "—" },
      { label: t("Chủ tài khoản"), value: bank?.accountName || "—" },
      { label: t("Số tiền"), value: `${ctx.amountBase.toLocaleString("vi-VN")}đ` },
      { label: t("Nội dung CK"), value: ctx.reference },
    ];
    return { kind: "instructions", title: t("Chuyển khoản theo thông tin dưới đây"), lines, note: t("Ghi đúng nội dung chuyển khoản. Giao dịch sẽ được duyệt sau khi admin xác nhận.") };
  },
};
