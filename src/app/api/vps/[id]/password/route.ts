import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encrypt";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vps = await prisma.vpsOrder.findFirst({
    where: { id: (await params).id, userId: session.user.id },
    select: { rootPassword: true, ipAddress: true, hostname: true },
  });
  if (!vps) return NextResponse.json({ error: "VPS không tồn tại" }, { status: 404 });

  const password = vps.rootPassword ? decrypt(vps.rootPassword) : null;
  return NextResponse.json({ success: true, data: { password, ip: vps.ipAddress, hostname: vps.hostname } });
}
