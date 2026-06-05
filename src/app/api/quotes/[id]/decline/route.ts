import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { declineQuote } from "@/lib/quotes";
import { getServerT } from "@/lib/i18n/server";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { t } = await getServerT();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const res = await declineQuote(id, session.user.id);
  if (!res.ok) return NextResponse.json({ error: t("Báo giá không thể phản hồi") }, { status: 400 });
  return NextResponse.json({ success: true, message: t("Đã từ chối báo giá") });
}
