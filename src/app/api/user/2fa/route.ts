import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action, token } = await req.json();

  if (action === "generate") {
    const secret = speakeasy.generateSecret({ name: `ShopVPS (${session.user.email})`, issuer: "ShopVPS" });
    await prisma.user.update({ where: { id: session.user.id }, data: { twoFactorSecret: secret.base32 } });
    const qrUrl = await QRCode.toDataURL(secret.otpauth_url!);
    return NextResponse.json({ success: true, data: { secret: secret.base32, qrUrl } });
  }

  if (action === "enable") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.twoFactorSecret) return NextResponse.json({ error: "Chưa generate secret" }, { status: 400 });
    const valid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: "base32", token, window: 2 });
    if (!valid) return NextResponse.json({ error: "Mã không đúng" }, { status: 400 });
    await prisma.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: true } });
    return NextResponse.json({ success: true });
  }

  if (action === "disable") {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.twoFactorSecret) return NextResponse.json({ error: "Chưa bật 2FA" }, { status: 400 });
    const valid = speakeasy.totp.verify({ secret: user.twoFactorSecret, encoding: "base32", token, window: 2 });
    if (!valid) return NextResponse.json({ error: "Mã không đúng" }, { status: 400 });
    await prisma.user.update({ where: { id: session.user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
}
