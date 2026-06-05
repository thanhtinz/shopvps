import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, email } = await req.json();

    const verifyToken = await prisma.verificationToken.findFirst({
      where: { identifier: email, token },
    });

    if (!verifyToken || verifyToken.expires < new Date()) {
      return NextResponse.json({ error: "Token không hợp lệ hoặc đã hết hạn" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await prisma.verificationToken.delete({ where: { token } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Đã có lỗi xảy ra" }, { status: 500 });
  }
}
