import { prisma } from "@/lib/prisma";
import type { GatewayModule } from "./types";

// Manual bank transfer — admin confirms the deposit after seeing the money.
export const manualGateway: GatewayModule = {
  code: "manual",
  label: "Chuyển khoản ngân hàng (thủ công)",
  auto: false,
  createsPendingTxn: true,
  async initiate(ctx) {
    const bank = await prisma.bankAccount.findFirst({ where: { isActive: true, isPrimary: true } })
      || await prisma.bankAccount.findFirst({ where: { isActive: true } });
    const lines = [
      { label: "Ngân hàng", value: bank ? `${bank.bankName} (${bank.bankCode})` : "—" },
      { label: "Số tài khoản", value: bank?.accountNumber || "—" },
      { label: "Chủ tài khoản", value: bank?.accountName || "—" },
      { label: "Số tiền", value: `${ctx.amountBase.toLocaleString("vi-VN")}đ` },
      { label: "Nội dung CK", value: ctx.reference },
    ];
    return { kind: "instructions", title: "Chuyển khoản theo thông tin dưới đây", lines, note: "Ghi đúng nội dung chuyển khoản. Giao dịch sẽ được duyệt sau khi admin xác nhận." };
  },
};
