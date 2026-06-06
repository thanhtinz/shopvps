import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, verifyEmailTemplate } from "@/lib/email";
import { generateAffiliateCode } from "@/lib/utils";
import crypto from "crypto";
import { getServerT } from "@/lib/i18n/server";
import { isBlocked, assessSignup, getClientIp, getCountry, verifyRecaptcha } from "@/lib/fraud";

export async function POST(req: NextRequest) {
  const { t, locale } = await getServerT();
  try {
    const { name, email, password, ref, recaptchaToken } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: t("Thiếu thông tin bắt buộc") }, { status: 400 });
    }

    // Bot protection (skipped automatically when reCAPTCHA isn't configured).
    const captcha = await verifyRecaptcha(recaptchaToken, getClientIp(req.headers));
    if (!captcha.ok) return NextResponse.json({ error: t("Xác minh reCAPTCHA thất bại") }, { status: 400 });

    if (password.length < 8) {
      return NextResponse.json({ error: t("Mật khẩu phải ít nhất 8 ký tự") }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: t("Email đã được sử dụng") }, { status: 400 });
    }

    // Fraud screening: hard-block the blocklist, score everything else.
    const ip = getClientIp(req.headers);
    const country = getCountry(req.headers);
    const blk = await isBlocked({ email, ip, country });
    if (blk.blocked) return NextResponse.json({ error: t("Đăng ký không được phép") }, { status: 403 });
    const risk = await assessSignup({ email, ip });

    const hashedPassword = await bcrypt.hash(password, 12);
    const affiliateCode = generateAffiliateCode();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        affiliateCode,
        locale,
        riskScore: risk.score,
        riskFlags: risk.flags.length ? risk.flags : undefined,
      },
    });

    // Record the registration for IP-velocity scoring of later signups.
    await prisma.activityLog.create({ data: { userId: user.id, action: "register", ipAddress: ip || undefined } }).catch(() => {});

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
      subject: t("Xác thực email - ShopVPS"),
      html: verifyEmailTemplate(name, verifyUrl, locale),
    });

    return NextResponse.json({ success: true, message: t("Đăng ký thành công! Vui lòng kiểm tra email.") });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: t("Đã có lỗi xảy ra") }, { status: 500 });
  }
}
