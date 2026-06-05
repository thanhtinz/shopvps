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
  const { note } = await req.json().catch(() => ({ note: undefined }));

  const res = await refundInvoice(id, note, locale);
  if (!res.ok) {
    const msg: Record<string, string> = {
      NOT_FOUND: t("Hoá đơn không tồn tại"),
      NOT_REFUNDABLE: t("Chỉ hoàn được hoá đơn đã thanh toán"),
    };
    return NextResponse.json({ error: msg[res.reason || ""] || t("Không thể hoàn tiền") }, { status: 400 });
  }
  return NextResponse.json({ success: true, data: { amount: res.amount }, message: t("Đã hoàn tiền hoá đơn") });
}
