import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { payInvoiceFromWallet } from "@/lib/billing";
import { reactivateServices } from "@/lib/billing-provider";
import { getServerT } from "@/lib/i18n/server";

// Pay an UNPAID invoice from the signed-in user's wallet balance. For renewal
// invoices this also extends and reactivates the linked services.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { t } = await getServerT();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const res = await payInvoiceFromWallet(id, session.user.id);
  if (!res.ok) {
    const msg: Record<string, string> = {
      NOT_FOUND: t("Hoá đơn không tồn tại"),
      NOT_OWNER: t("Hoá đơn không tồn tại"),
      ALREADY_PAID: t("Hoá đơn đã được thanh toán"),
      INSUFFICIENT_BALANCE: t("Số dư không đủ để thanh toán"),
    };
    return NextResponse.json({ error: msg[res.reason || ""] || t("Không thể thanh toán hoá đơn") }, { status: 400 });
  }

  // Best-effort: lift provider-side suspension for reactivated services.
  if (res.reactivated) await reactivateServices(res.reactivated);

  return NextResponse.json({ success: true, message: t("Đã thanh toán hoá đơn thành công") });
}
