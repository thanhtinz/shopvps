import { NextRequest, NextResponse } from "next/server";
import { verifyLicense } from "@/lib/license/client";
import { getHardwareFingerprint } from "@/lib/license/fingerprint";

export async function POST(req: NextRequest) {
  try {
    const { licenseKey } = await req.json();
    if (!licenseKey?.trim()) return NextResponse.json({ error: "Vui lòng nhập license key" }, { status: 400 });

    const host = req.headers.get("host") || "localhost";
    const domain = host.replace(/:\d+$/, "");

    const result = await verifyLicense({ licenseKey: licenseKey.trim(), domain });

    if (!result.valid) {
      const messages: Record<string, string> = {
        KEY_NOT_FOUND: "License key không tồn tại",
        REVOKED: "License key đã bị thu hồi",
        EXPIRED: "License key đã hết hạn",
        DOMAIN_MISMATCH: `Domain '${domain}' không được phép dùng key này`,
        VERSION_NOT_LICENSED: "Phiên bản này không được cấp phép",
        HW_MISMATCH: "Phần cứng server không khớp",
        PRODUCT_MISMATCH: "Key này không phải cho ShopVPS",
        RATE_LIMITED: "Quá nhiều yêu cầu, vui lòng thử lại sau",
        LICENSE_SERVER_UNREACHABLE: "Không thể kết nối máy chủ license",
      };
      return NextResponse.json({ valid: false, error: messages[result.reason || ""] || result.reason });
    }

    return NextResponse.json({ valid: true, domain, expiresAt: result.expiresAt, hwFingerprint: getHardwareFingerprint() });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
