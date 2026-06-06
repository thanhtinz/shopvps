import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";

// Public: exposes only the reCAPTCHA site key (safe to share) for the v3 widget.
export async function GET() {
  const s = await getSettings(["recaptcha_site_key"]);
  return NextResponse.json({ siteKey: s.recaptcha_site_key || "" });
}
