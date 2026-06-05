import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { refundInvoice } from "@/lib/refund";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { t, locale } = await getServerT();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { note, amount } = await req.json().catch(() => ({ note: undefined, amount: undefined }));
  const amt = amount != null && amount !== "" ? Number(amount) : undefined;
  if (amt != null && !(amt > 0)) return NextResponse.json({ error: t("Số tiền hoàn không hợp lệ") }, { status: 400 });

  const res = await refundInvoice(id, note, locale, amt);
  if (!res.ok) {
    const msg: Record<string, string> = {
      NOT_FOUND: t("Hoá đơn không tồn tại"),
      NOT_REFUNDABLE: t("Chỉ hoàn được hoá đơn đã thanh toán"),
      INVALID_AMOUNT: t("Số tiền hoàn không hợp lệ"),
    };
    return NextResponse.json({ error: msg[res.reason || ""] || t("Không thể hoàn tiền") }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: { amount: res.amount, partial: res.partial }, message: t("Đã hoàn tiền hoá đơn") });
}
