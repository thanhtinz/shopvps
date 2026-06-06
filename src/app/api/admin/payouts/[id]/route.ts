import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { approvePayout, rejectPayout } from "@/lib/payouts";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { t, locale } = await getServerT();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const { action, adminNote } = await req.json();
  const ok = action === "approve"
    ? await approvePayout(id, adminNote, locale)
    : action === "reject" ? await rejectPayout(id, adminNote, locale) : false;
  if (!ok) return NextResponse.json({ error: t("Yêu cầu đã được xử lý hoặc không hợp lệ") }, { status: 400 });
  return NextResponse.json({ success: true });
}
