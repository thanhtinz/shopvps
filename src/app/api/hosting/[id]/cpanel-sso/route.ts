import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWHMClient } from "@/lib/whm";
import { getServerT } from "@/lib/i18n/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hosting = await prisma.hostingOrder.findFirst({
    where: { id: (await params).id, userId: session.user.id, status: "ACTIVE" },
    include: { server: true },
  });
  if (!hosting) return NextResponse.json({ error: t("Hosting không tồn tại hoặc chưa active") }, { status: 404 });
  if (!hosting.cpanelUsername) return NextResponse.json({ error: t("Username cPanel chưa được tạo") }, { status: 400 });

  try {
    const whm = getWHMClient(hosting.server);
    const ssoUrl = await whm.createSSO(hosting.cpanelUsername);

    await prisma.activityLog.create({
      data: { userId: session.user.id, action: "hosting.cpanel_sso", resource: "hosting_order", resourceId: (await params).id },
    });

    return NextResponse.json({ success: true, data: { url: ssoUrl } });
  } catch (err: any) {
    return NextResponse.json({ error: t("Không thể tạo SSO: ") + err.message }, { status: 500 });
  }
}
