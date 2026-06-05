import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";
import { validateCoupon } from "@/lib/coupons";

export async function POST(req: NextRequest) {
  const { t, locale } = await getServerT();
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code, orderAmount, productType, packageId } = await req.json();
  if (!code) return NextResponse.json({ error: t("Thiếu mã coupon") }, { status: 400 });

  const res = await validateCoupon(code, { orderAmount: Number(orderAmount) || 0, productType, packageId }, locale);
  if (!res.valid) return NextResponse.json({ valid: false, error: res.error });

  return NextResponse.json({
    valid: true,
    data: {
      code: res.coupon.code, type: res.coupon.type, value: Number(res.coupon.value),
      discount: res.discount, finalAmount: res.finalAmount,
    },
  });
}
