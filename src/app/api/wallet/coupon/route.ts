import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, orderAmount } = await req.json();
  if (!code) return NextResponse.json({ error: "Thiếu mã coupon" }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

  if (!coupon || !coupon.isActive) return NextResponse.json({ valid: false, error: "Mã không tồn tại hoặc đã bị vô hiệu" });
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return NextResponse.json({ valid: false, error: "Mã đã hết hạn" });
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return NextResponse.json({ valid: false, error: "Mã đã hết lượt dùng" });
  if (coupon.minOrder && orderAmount < Number(coupon.minOrder))
    return NextResponse.json({ valid: false, error: `Đơn hàng tối thiểu ${Number(coupon.minOrder).toLocaleString("vi-VN")}đ` });

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = Math.floor(orderAmount * Number(coupon.value) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  } else {
    discount = Number(coupon.value);
  }

  return NextResponse.json({
    valid: true,
    data: {
      code: coupon.code, type: coupon.type, value: Number(coupon.value),
      discount, finalAmount: Math.max(0, orderAmount - discount),
    },
  });
}
