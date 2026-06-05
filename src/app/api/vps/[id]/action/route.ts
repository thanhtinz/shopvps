import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";


import { prisma } from "@/lib/prisma";
import { getVpsProvider } from "@/lib/vps-providers";
import { decrypt } from "@/lib/encrypt";

type Action = "power_on" | "power_off" | "restart" | "rebuild" | "change_password";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, osId, password } = await req.json();
  const vpsId = (await params).id;

  const vps = await prisma.vpsOrder.findFirst({
    where: { id: vpsId, userId: session.user.id },
    include: { provider: true },
  });

  if (!vps) return NextResponse.json({ error: "VPS không tồn tại" }, { status: 404 });
  if (!vps.providerVpsId) return NextResponse.json({ error: "VPS chưa được khởi tạo" }, { status: 400 });

  try {
    const provider = getVpsProvider(vps.provider.slug, decrypt(vps.provider.apiKey!));

    switch (action as Action) {
      case "power_on":
        await provider.powerOn(vps.providerVpsId);
        break;
      case "power_off":
        await provider.powerOff(vps.providerVpsId);
        break;
      case "restart":
        await provider.reboot(vps.providerVpsId);
        break;
      case "rebuild":
        if (!osId) return NextResponse.json({ error: "Thiếu OS" }, { status: 400 });
        await provider.rebuild(vps.providerVpsId, osId);
        await prisma.vpsOrder.update({ where: { id: vpsId }, data: { status: "REBUILDING", os: osId } });
        break;
      case "change_password":
        if (!password) return NextResponse.json({ error: "Thiếu mật khẩu" }, { status: 400 });
        await provider.changePassword(vps.providerVpsId, password);
        break;
      default:
        return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
    }

    // Log the action
    await prisma.vpsLog.create({
      data: {
        vpsOrderId: vpsId,
        action,
        status: "success",
        performedBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    await prisma.vpsLog.create({
      data: {
        vpsOrderId: vpsId,
        action,
        status: "failed",
        message: error.message,
        performedBy: session.user.id,
      },
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
