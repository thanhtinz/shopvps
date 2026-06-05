import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { acceptQuote } from "@/lib/quotes";
import { getServerT } from "@/lib/i18n/server";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { t } = await getServerT();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await acceptQuote(id, session.user.id);
  if (!res.ok) {
    const msg: Record<string, string> = {
      NOT_FOUND: t("Báo giá không tồn tại"),
      NOT_OWNER: t("Báo giá không tồn tại"),
      NOT_OPEN: t("Báo giá không thể phản hồi"),
      EXPIRED: t("Báo giá đã hết hạn"),
    };
    return NextResponse.json({ error: msg[res.reason || ""] || t("Không thể chấp nhận báo giá") }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: { invoiceId: res.invoiceId }, message: t("Đã chấp nhận báo giá — hoá đơn đã được tạo") });
}
