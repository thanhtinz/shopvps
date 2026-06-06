import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

// Connectivity test against Let's Encrypt STAGING: verifies acme-client is
// installed, the email is set, and an ACME account can be created — without
// touching production rate limits or needing a domain.
export async function POST() {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const s = await getSettings(["acme_email"]);
  if (!s.acme_email) return NextResponse.json({ error: t("Chưa cấu hình email ACME") }, { status: 400 });

  let acme: any;
  const mod = "acme-client";
  try { acme = await import(/* webpackIgnore: true */ mod); }
  catch { return NextResponse.json({ error: t("Chưa cài acme-client (chạy npm install ở môi trường thật)") }, { status: 503 }); }

  try {
    const crypto = acme.crypto || acme.forge;
    const accountKey = await crypto.createPrivateKey();
    const client = new acme.Client({ directoryUrl: acme.directory.letsencrypt.staging, accountKey });
    await client.createAccount({ termsOfServiceAgreed: true, contact: [`mailto:${s.acme_email}`] });
    return NextResponse.json({ success: true, message: t("Kết nối ACME staging thành công. Tài khoản đã tạo.") });
  } catch (e: any) {
    return NextResponse.json({ error: `${t("Lỗi ACME")}: ${e?.message || e}` }, { status: 502 });
  }
}
