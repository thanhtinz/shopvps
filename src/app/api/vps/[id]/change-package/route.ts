import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { changeServicePackage } from "@/lib/upgrade";
import { resizeVpsAtProvider } from "@/lib/billing-provider";
import { getServerT, getUserT } from "@/lib/i18n/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const { t } = await getServerT();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { packageId } = await req.json().catch(() => ({ packageId: undefined }));
  if (!packageId) return NextResponse.json({ error: t("Gói không hợp lệ") }, { status: 400 });

  const res = await changeServicePackage("vps", id, session.user.id, packageId);
  if (!res.ok) {
    const msg: Record<string, string> = {
      NOT_FOUND: t("Dịch vụ không tồn tại"),
      TERMINATED: t("Dịch vụ đã bị huỷ"),
      SAME_PACKAGE: t("Bạn đang dùng gói này"),
      INVALID_PACKAGE: t("Gói không hợp lệ"),
      INSUFFICIENT_BALANCE: t("Số dư không đủ để nâng cấp"),
    };
    return NextResponse.json({ error: msg[res.reason || ""] || t("Không thể đổi gói") }, { status: 400 });
  }

  // Best-effort: resize the underlying VPS to the new provider plan.
  const newPkg = await prisma.vpsPackage.findUnique({ where: { id: packageId }, select: { slug: true } });
  if (newPkg?.slug) await resizeVpsAtProvider(id, newPkg.slug);

  const { t: tn } = await getUserT(session.user.id);
  await prisma.notification.create({
    data: {
      userId: session.user.id, type: "INFO",
      title: tn("Đã đổi gói dịch vụ"),
      content: `${tn("Dịch vụ đã chuyển sang gói")} ${res.packageName}.`,
    },
  });

  return NextResponse.json({ success: true, data: { diff: res.diff }, message: t("Đã đổi gói thành công") });
}
