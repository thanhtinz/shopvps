import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";
import { requestPayout, getPayoutConfig, PAYOUT_METHODS, type PayoutMethod } from "@/lib/payouts";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [payouts, user, config] = await Promise.all([
    prisma.payout.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { affiliateBalance: true, autoPayout: true } }),
    getPayoutConfig(),
  ]);
  return NextResponse.json({ success: true, data: { payouts, affiliateBalance: Number(user?.affiliateBalance || 0), autoPayout: user?.autoPayout ?? true, config } });
}

export async function POST(req: NextRequest) {
  const { t, locale } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { amount, method, destination } = await req.json();
  const m = String(method || "wallet") as PayoutMethod;
  if (!PAYOUT_METHODS.includes(m)) return NextResponse.json({ error: t("Phương thức không hợp lệ") }, { status: 400 });

  const res = await requestPayout(session.user.id, Number(amount), m, destination, locale);
  if (!res.ok) {
    const msg: Record<string, string> = {
      INVALID_METHOD: t("Phương thức không hợp lệ"),
      INVALID_AMOUNT: t("Số tiền không hợp lệ"),
      NEED_DESTINATION: t("Vui lòng nhập thông tin nhận tiền"),
      MIN_NOT_MET: t("Số tiền dưới mức tối thiểu"),
      INSUFFICIENT_BALANCE: t("Số dư hoa hồng không đủ"),
    };
    return NextResponse.json({ error: msg[res.reason || ""] || t("Không thể tạo yêu cầu rút") }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: { instant: res.instant }, message: res.instant ? t("Đã chuyển vào ví chính") : t("Đã gửi yêu cầu rút, chờ duyệt") });
}

// Toggle the user's automatic-payout preference.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { autoPayout } = await req.json();
  await prisma.user.update({ where: { id: session.user.id }, data: { autoPayout: !!autoPayout } });
  return NextResponse.json({ success: true });
}
