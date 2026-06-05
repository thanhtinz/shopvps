import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  try {
    const { token, email } = await req.json();

    const verifyToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token },
    });

    if (!verifyToken || verifyToken.expires < new Date()) {
      return NextResponse.json({ error: t("Token không hợp lệ hoặc đã hết hạn") }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: t("Đã có lỗi xảy ra") }, { status: 500 });
  }
}
