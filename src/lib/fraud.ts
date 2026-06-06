import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// A small disposable / throwaway email domain list. Extend as needed.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "temp-mail.org", "yopmail.com", "trashmail.com", "throwawaymail.com",
  "getnada.com", "maildrop.cc", "dispostable.com", "fakeinbox.com",
  "sharklasers.com", "guerrillamailblock.com", "mohmal.com", "emailondeck.com",
  "tmail.com", "moakt.com", "luxusmail.org", "1secmail.com", "mailnesia.com",
]);

export interface RiskResult { score: number; flags: string[] }

/** Best-effort client IP from common proxy headers. */
export function getClientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return headers.get("x-real-ip") || headers.get("cf-connecting-ip") || null;
}

/** Country from edge headers (Vercel / Cloudflare), if present. */
export function getCountry(headers: Headers): string | null {
  return (headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || "").toUpperCase() || null;
}

function domainOf(email: string): string {
  return (email.split("@")[1] || "").toLowerCase().trim();
}

/** Hard block check against the admin blocklist. */
export async function isBlocked(ctx: { email?: string; ip?: string | null; country?: string | null }): Promise<{ blocked: boolean; reason?: string }> {
  const checks: { type: string; value: string }[] = [];
  if (ctx.email) { checks.push({ type: "EMAIL", value: ctx.email.toLowerCase() }); checks.push({ type: "DOMAIN", value: domainOf(ctx.email) }); }
  if (ctx.ip) checks.push({ type: "IP", value: ctx.ip });
  if (ctx.country) checks.push({ type: "COUNTRY", value: ctx.country.toUpperCase() });
  if (checks.length === 0) return { blocked: false };

  const hit = await prisma.blocklist.findFirst({ where: { OR: checks.map((c) => ({ type: c.type, value: c.value })) } });
  return hit ? { blocked: true, reason: hit.reason || hit.type } : { blocked: false };
}

/**
 * Score a signup for fraud signals (does not block — high scores are surfaced
 * to admins). Signals: disposable email domain, plus-addressing, and IP
 * velocity (many recent registrations from the same address).
 */
export async function assessSignup(ctx: { email: string; ip?: string | null }): Promise<RiskResult> {
  const flags: string[] = [];
  let score = 0;

  const domain = domainOf(ctx.email);
  if (DISPOSABLE_DOMAINS.has(domain)) { flags.push("disposable_email"); score += 40; }
  if (ctx.email.split("@")[0]?.includes("+")) { flags.push("plus_addressing"); score += 10; }

  if (ctx.ip) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await prisma.activityLog.count({ where: { action: "register", ipAddress: ctx.ip, createdAt: { gte: since } } });
    if (recent >= 2) { flags.push("ip_velocity"); score += Math.min(40, recent * 15); }

    // MaxMind minFraud risk (if configured) folds into the score.
    const mm = await maxmindScore(ctx.ip, ctx.email);
    if (mm != null) { score += Math.round(mm * 0.5); if (mm >= 40) flags.push("maxmind_high"); }
  }

  return { score: Math.min(100, score), flags };
}

/** MaxMind minFraud Score (0-100 risk), or null when not configured / on error. */
export async function maxmindScore(ip: string, email?: string): Promise<number | null> {
  const s = await getSettings(["maxmind_account_id", "maxmind_license_key"]);
  if (!s.maxmind_account_id || !s.maxmind_license_key) return null;
  try {
    const auth = Buffer.from(`${s.maxmind_account_id}:${s.maxmind_license_key}`).toString("base64");
    const res = await fetch("https://minfraud.maxmind.com/minfraud/v2.0/score", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ device: { ip_address: ip }, ...(email ? { email: { address: email } } : {}) }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.risk_score === "number" ? data.risk_score : null;
  } catch { return null; }
}

/**
 * Verify a reCAPTCHA v3 token. Returns ok=true (skips) when no secret is set, so
 * the site keeps working until reCAPTCHA is configured.
 */
export async function verifyRecaptcha(token: string | undefined, ip?: string | null): Promise<{ ok: boolean; score?: number }> {
  const s = await getSettings(["recaptcha_secret", "recaptcha_min_score"]);
  if (!s.recaptcha_secret) return { ok: true };
  if (!token) return { ok: false };
  try {
    const params = new URLSearchParams({ secret: s.recaptcha_secret, response: token });
    if (ip) params.set("remoteip", ip);
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: params.toString(),
    });
    const data = await res.json();
    const min = parseFloat(s.recaptcha_min_score || "0.5") || 0.5;
    const score = typeof data?.score === "number" ? data.score : 1;
    return { ok: !!data?.success && score >= min, score };
  } catch { return { ok: false }; }
}
