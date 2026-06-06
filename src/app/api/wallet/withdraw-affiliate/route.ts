import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { requestPayout } from "@/lib/payouts";

// Backward-compatible instant withdrawal of affiliate commission into the main
// wallet. Routes through the unified payout flow (method = wallet).
export async function POST(req: NextRequest) {
  const { t, locale } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  const res = await requestPayout(session.user.id, Number(amount), "wallet", undefined, locale);
  if (!res.ok) {
    const msg: Record<string, string> = {
      INVALID_AMOUNT: t("Số tiền không hợp lệ"),
      MIN_NOT_MET: t("Số tiền dưới mức tối thiểu"),
      INSUFFICIENT_BALANCE: t("Số dư hoa hồng không đủ"),
    };
    return NextResponse.json({ error: msg[res.reason || ""] || t("Không thể rút hoa hồng") }, { status: 400 });
  }
  return NextResponse.json({ success: true, message: `${t("Đã chuyển")} ${Number(amount).toLocaleString("vi-VN")}đ ${t("vào ví chính")}` });
}
