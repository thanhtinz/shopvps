import { NextRequest, NextResponse } from "next/server";
import { verifyLicense } from "@/lib/license/client";
import { getHardwareFingerprint } from "@/lib/license/fingerprint";
import { resolveLicenseDomain } from "@/lib/license/domain";
import { getServerT } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  try {
    const { licenseKey } = await req.json();
    if (!licenseKey?.trim()) return NextResponse.json({ error: t("Vui lòng nhập license key") }, { status: 400 });

    const domain = resolveLicenseDomain(req);

    const result = await verifyLicense({ licenseKey: licenseKey.trim(), domain });

    if (!result.valid) {
      const messages: Record<string, string> = {
        KEY_NOT_FOUND: t("License key không tồn tại"),
        REVOKED: t("License key đã bị thu hồi"),
        EXPIRED: t("License key đã hết hạn"),
        DOMAIN_MISMATCH: `${t("Domain")} '${domain}' ${t("không được phép dùng key này")}`,
        VERSION_NOT_LICENSED: t("Phiên bản này không được cấp phép"),
        HW_MISMATCH: t("Phần cứng server không khớp"),
        PRODUCT_MISMATCH: t("Key này không phải cho ShopVPS"),
        RATE_LIMITED: t("Quá nhiều yêu cầu, vui lòng thử lại sau"),
        LICENSE_SERVER_UNREACHABLE: t("Không thể kết nối máy chủ license"),
      };
      return NextResponse.json({ valid: false, error: messages[result.reason || ""] || result.message || result.reason });
    }

    return NextResponse.json({ valid: true, domain, expiresAt: result.expiresAt, hwFingerprint: getHardwareFingerprint() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
