import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, verifyEmailTemplate } from "@/lib/email";
import { generateAffiliateCode } from "@/lib/utils";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, ref } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Mật khẩu phải ít nhất 8 ký tự" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email đã được sử dụng" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const affiliateCode = generateAffiliateCode();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        affiliateCode,
      },
    });

    // Handle affiliate referral
    if (ref) {
      const referrer = await prisma.user.findUnique({ where: { affiliateCode: ref } });
      if (referrer && referrer.id !== user.id) {
        const settings = await prisma.setting.findUnique({ where: { key: "affiliate_rate" } });
        const rate = settings ? parseFloat(settings.value) : 10;
        await prisma.affiliateReferral.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
            commissionRate: rate,
          },
        });
      }
    }

    // Send verification email
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}&email=${email}`;
    await sendEmail({
      to: email,
      subject: "Xác thực email - ShopVPS",
      html: verifyEmailTemplate(name, verifyUrl),
    });

    return NextResponse.json({ success: true, message: "Đăng ký thành công! Vui lòng kiểm tra email." });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
  }
}
