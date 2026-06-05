import { prisma } from "@/lib/prisma";
import { translate, type Locale } from "@/lib/i18n/dictionaries";

export interface CouponContext {
  orderAmount: number;
  productType?: "VPS" | "HOSTING" | null;  // what is being purchased
  packageId?: string | null;
}

export interface CouponValid {
  valid: true;
  coupon: any;
  discount: number;
  finalAmount: number;
}
export interface CouponInvalid { valid: false; error: string; }
export type CouponResult = CouponValid | CouponInvalid;

/**
 * Single source of truth for coupon validation, including the product scope
 * (productType + packageIds) that lets a coupon target only VPS, only hosting,
 * or specific packages. Messages default to Vietnamese; pass a translator-bound
 * locale via `loc` to localize.
 */
export async function validateCoupon(code: string, ctx: CouponContext, loc: Locale = "vi"): Promise<CouponResult> {
  const t = (k: string) => translate(loc, k);
  if (!code) return { valid: false, error: t("Thiếu mã coupon") };

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) return { valid: false, error: t("Mã không tồn tại hoặc đã bị vô hiệu") };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { valid: false, error: t("Mã đã hết hạn") };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, error: t("Mã đã hết lượt dùng") };

  // Product scope: type must match, and (if set) the package must be in the list.
  if (coupon.productType && ctx.productType && coupon.productType !== ctx.productType) {
    return { valid: false, error: t("Mã không áp dụng cho sản phẩm này") };
  }
  if (coupon.productType && !ctx.productType) {
    return { valid: false, error: t("Mã không áp dụng cho sản phẩm này") };
  }
  if (Array.isArray(coupon.packageIds) && coupon.packageIds.length > 0) {
    if (!ctx.packageId || !coupon.packageIds.includes(ctx.packageId)) {
      return { valid: false, error: t("Mã không áp dụng cho gói này") };
    }
  }

  if (coupon.minOrder && ctx.orderAmount < Number(coupon.minOrder)) {
    return { valid: false, error: `${t("Đơn hàng tối thiểu")} ${Number(coupon.minOrder).toLocaleString("vi-VN")}đ` };
  }

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = Math.floor((ctx.orderAmount * Number(coupon.value)) / 100);
    if (coupon.maxDiscount) discount = Math.min(discount, Number(coupon.maxDiscount));
  } else {
    discount = Number(coupon.value);
  }
  discount = Math.min(discount, ctx.orderAmount);

  return { valid: true, coupon, discount, finalAmount: Math.max(0, ctx.orderAmount - discount) };
}
