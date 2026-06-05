import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyLicense } from "@/lib/license/client";
import { getHardwareFingerprint } from "@/lib/license/fingerprint";
import bcrypt from "bcryptjs";
import { generateAffiliateCode } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const existing = await prisma.appSetup.findUnique({ where: { id: "singleton" } });
    if (existing) return NextResponse.json({ error: "Hệ thống đã được setup" }, { status: 400 });

    const { licenseKey, adminName, adminEmail, adminPassword } = await req.json();
    if (!licenseKey || !adminEmail || !adminPassword || !adminName)
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    if (adminPassword.length < 8)
      return NextResponse.json({ error: "Mật khẩu tối thiểu 8 ký tự" }, { status: 400 });

    const host = req.headers.get("host") || "localhost";
    const domain = host.replace(/:\d+$/, "");

    const result = await verifyLicense({ licenseKey: licenseKey.trim(), domain });
    if (!result.valid) return NextResponse.json({ error: "License key không hợp lệ" }, { status: 400 });

    const existingUser = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingUser) return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 400 });

    await prisma.$transaction(async (tx: any) => {
      await tx.appSetup.create({
        data: {
          id: "singleton",
          licenseKey: licenseKey.trim(),
          domain,
          runtimeKey: result.runtimeKey || "",
          hwFingerprint: getHardwareFingerprint(),
          expiresAt: result.expiresAt ? new Date(result.expiresAt) : null,
          setupBy: adminEmail,
          lastVerifiedAt: new Date(),
          verifyStatus: "VALID",
        },
      });

      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      await tx.user.create({
        data: {
          name: adminName,
          email: adminEmail,
          password: hashedPassword,
          role: "SUPER_ADMIN",
          emailVerified: new Date(),
          affiliateCode: generateAffiliateCode(),
        },
      });
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set("__ls", "VALID", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
