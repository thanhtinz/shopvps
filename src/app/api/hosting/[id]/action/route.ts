import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWHMClient } from "@/lib/whm";
import { encrypt } from "@/lib/encrypt";
import { getServerT } from "@/lib/i18n/server";

type Action = "suspend" | "unsuspend" | "terminate" | "change_password";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, password } = await req.json();
  const id = (await params).id;

  const hosting = await prisma.hostingOrder.findFirst({
    where: { id, userId: session.user.id },
    include: { server: true },
  });
  if (!hosting) return NextResponse.json({ error: t("Hosting không tồn tại") }, { status: 404 });
  if (!hosting.cpanelUsername) return NextResponse.json({ error: t("Tài khoản cPanel chưa được tạo") }, { status: 400 });

  try {
    const whm = getWHMClient(hosting.server);
    const username = hosting.cpanelUsername;

    switch (action as Action) {
      case "suspend":
        await whm.suspendAccount(username, "Tạm dừng theo yêu cầu");
        await prisma.hostingOrder.update({ where: { id }, data: { status: "SUSPENDED" } });
        break;
      case "unsuspend":
        await whm.unsuspendAccount(username);
        await prisma.hostingOrder.update({ where: { id }, data: { status: "ACTIVE" } });
        break;
      case "terminate":
        await whm.terminateAccount(username);
        await prisma.hostingOrder.update({ where: { id }, data: { status: "TERMINATED" } });
        break;
      case "change_password":
        if (!password || String(password).length < 8)
          return NextResponse.json({ error: t("Mật khẩu tối thiểu 8 ký tự") }, { status: 400 });
        await whm.changePassword(username, password);
        await prisma.hostingOrder.update({ where: { id }, data: { cpanelPassword: encrypt(password) } });
        break;
      default:
        return NextResponse.json({ error: t("Action không hợp lệ") }, { status: 400 });
    }

    await prisma.activityLog.create({
      data: { userId: session.user.id, action: `hosting.${action}`, resource: "hosting_order", resourceId: id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: t("Thao tác thất bại: ") + err.message }, { status: 500 });
  }
}
