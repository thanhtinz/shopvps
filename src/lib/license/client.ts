import crypto from "crypto";
import { getHardwareFingerprint } from "./fingerprint";
import { getLicenseEndpoint } from "./endpoint";

const PRODUCT_ID = "SHOPVPS";
const VERSION = process.env.npm_package_version || "1.0.0";

// Cache kết quả verify trong memory — tránh gọi API mỗi request
let cache: {
  valid: boolean;
  runtimeKey: string | null;
  expiresAt: string | null;
  checkedAt: number;
} | null = null;

const CACHE_TTL = 60 * 60 * 1000; // 1 giờ
const GRACE_PERIOD = 24 * 60 * 60 * 1000; // 24 giờ nếu server license unreachable

// Timestamp format expected by the license server (anti-replay). Configurable
// so it matches whatever the deployed license-platform validates against.
function licenseTimestamp(): number | string {
  const fmt = (process.env.LS_TIMESTAMP_FORMAT || "ms").toLowerCase();
  if (fmt === "sec") return Math.floor(Date.now() / 1000);
  if (fmt === "iso") return new Date().toISOString();
  return Date.now(); // milliseconds (default)
}

export interface VerifyResult {
  valid: boolean;
  reason?: string;
  message?: string;
  runtimeKey?: string;
  expiresAt?: string;
  fromCache?: boolean;
  grace?: boolean;
}

export async function verifyLicense(opts: {
  licenseKey: string;
  domain: string;
  serverUrl?: string;
}): Promise<VerifyResult> {
  const { licenseKey, domain } = opts;
  const serverUrl = opts.serverUrl || getLicenseEndpoint();

  // Trả cache nếu còn mới
  if (cache && Date.now() - cache.checkedAt < CACHE_TTL) {
    return {
      valid: cache.valid,
      runtimeKey: cache.runtimeKey ?? undefined,
      expiresAt: cache.expiresAt ?? undefined,
      fromCache: true,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`${serverUrl}/api/v1/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key: licenseKey,
        product_id: PRODUCT_ID,
        version: VERSION,
        domain,
        hw_fingerprint: getHardwareFingerprint(),
        // Anti-replay fields documented by the license server contract.
        timestamp: licenseTimestamp(),
        nonce: crypto.randomBytes(16).toString("hex"),
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Surface non-2xx responses with the server's text (e.g. a 403 "Host not in
    // allowlist" from the license server) instead of letting res.json() throw
    // into the generic "unreachable" path — so the setup UI shows the real cause.
    if (!res.ok) {
      const text = (await res.text().catch(() => "")).slice(0, 200);
      return { valid: false, reason: `SERVER_${res.status}`, message: text || `License server HTTP ${res.status}` };
    }

    const data = await res.json().catch(() => ({} as any));

    cache = {
      valid: data.valid,
      runtimeKey: data.runtime_key ?? null,
      expiresAt: data.expires_at ?? null,
      checkedAt: Date.now(),
    };

    return {
      valid: data.valid,
      reason: data.reason,
      runtimeKey: data.runtime_key,
      expiresAt: data.expires_at,
    };
  } catch (err) {
    // License server unreachable → dùng grace period
    if (cache) {
      const age = Date.now() - cache.checkedAt;
      if (age < GRACE_PERIOD) {
        return {
          valid: cache.valid,
          runtimeKey: cache.runtimeKey ?? undefined,
          fromCache: true,
          grace: true,
        };
      }
    }

    // Hết grace period → block
    return {
      valid: false,
      reason: "LICENSE_SERVER_UNREACHABLE",
    };
  }
}

export function clearLicenseCache() {
  cache = null;
}

export function getCachedRuntimeKey(): string | null {
  return cache?.runtimeKey ?? null;
}
