import { getSettings } from "@/lib/settings";
import { CYCLE_MONTHS } from "@/lib/utils";

// ── Catalog taxonomy ────────────────────────────────────────────────────────
// A flexible Group → Type taxonomy so the generic Product/ProductOrder system
// can sell any service line without schema/enum changes.

export interface ProductGroupDef { id: string; label: string }
export interface ProductTypeDef { group: string; type: string; label: string; autoActivate?: boolean }

export const PRODUCT_GROUPS: ProductGroupDef[] = [
  { id: "SERVER_HOSTING", label: "Server & Hosting" },
  { id: "NETWORK_SECURITY", label: "Network & Security" },
  { id: "DOMAIN", label: "Tên miền" },
  { id: "DEVELOPER", label: "Developer Services" },
  { id: "AI", label: "AI Services" },
  { id: "MARKETING", label: "MMO & Marketing" },
  { id: "LICENSE", label: "License Services" },
];

export const CRONJOB_TYPE = "cronjob";

export const PRODUCT_TYPES: ProductTypeDef[] = [
  // Server & Hosting
  { group: "SERVER_HOSTING", type: "vps-kvm", label: "VPS KVM" },
  { group: "SERVER_HOSTING", type: "cloud-vps", label: "Cloud VPS" },
  { group: "SERVER_HOSTING", type: "dedicated", label: "Dedicated Server" },
  { group: "SERVER_HOSTING", type: "gpu-server", label: "GPU Server" },
  { group: "SERVER_HOSTING", type: "windows-vps", label: "Windows VPS" },
  { group: "SERVER_HOSTING", type: "storage-vps", label: "Storage VPS" },
  { group: "SERVER_HOSTING", type: "game-server", label: "Game Server Hosting" },
  { group: "SERVER_HOSTING", type: "shared-hosting", label: "Shared Hosting" },
  { group: "SERVER_HOSTING", type: "reseller-hosting", label: "Reseller Hosting" },
  { group: "SERVER_HOSTING", type: "wordpress-hosting", label: "WordPress Hosting" },
  { group: "SERVER_HOSTING", type: "email-hosting", label: "Email Hosting" },
  // Network & Security
  { group: "NETWORK_SECURITY", type: "proxy-ipv4", label: "Proxy IPv4", autoActivate: true },
  { group: "NETWORK_SECURITY", type: "proxy-ipv6", label: "Proxy IPv6", autoActivate: true },
  { group: "NETWORK_SECURITY", type: "residential-proxy", label: "Residential Proxy", autoActivate: true },
  { group: "NETWORK_SECURITY", type: "socks5-proxy", label: "SOCKS5 Proxy", autoActivate: true },
  { group: "NETWORK_SECURITY", type: "vpn", label: "VPN Server" },
  { group: "NETWORK_SECURITY", type: "ddos-protection", label: "DDoS Protection" },
  { group: "NETWORK_SECURITY", type: "cdn", label: "CDN" },
  { group: "NETWORK_SECURITY", type: "waf", label: "WAF" },
  { group: "NETWORK_SECURITY", type: "ssl", label: "SSL Certificate" },
  // Domain
  { group: "DOMAIN", type: "domain-register", label: "Đăng ký tên miền" },
  { group: "DOMAIN", type: "domain-renew", label: "Gia hạn tên miền" },
  { group: "DOMAIN", type: "domain-transfer", label: "Transfer tên miền" },
  { group: "DOMAIN", type: "whois-privacy", label: "Whois Privacy", autoActivate: true },
  { group: "DOMAIN", type: "dns-hosting", label: "DNS Hosting", autoActivate: true },
  // Developer Services
  { group: "DEVELOPER", type: "managed-database", label: "Managed Database (MySQL/PostgreSQL/Redis)" },
  { group: "DEVELOPER", type: "object-storage", label: "Object Storage (S3)", autoActivate: true },
  { group: "DEVELOPER", type: "backup-storage", label: "Backup Storage", autoActivate: true },
  { group: "DEVELOPER", type: CRONJOB_TYPE, label: "Cron Job", autoActivate: true },
  { group: "DEVELOPER", type: "docker-hosting", label: "Docker Hosting" },
  { group: "DEVELOPER", type: "kubernetes", label: "Kubernetes Cluster" },
  { group: "DEVELOPER", type: "cicd-runner", label: "CI/CD Runner" },
  { group: "DEVELOPER", type: "git-hosting", label: "Git Hosting", autoActivate: true },
  // AI Services
  { group: "AI", type: "ai-api-key", label: "AI API Key", autoActivate: true },
  { group: "AI", type: "gpu-hourly", label: "GPU thuê theo giờ" },
  { group: "AI", type: "model-hosting", label: "Model Hosting" },
  { group: "AI", type: "image-gen-api", label: "Image Generation API", autoActivate: true },
  { group: "AI", type: "voice-api", label: "Voice API", autoActivate: true },
  { group: "AI", type: "llm-gateway", label: "LLM API Gateway", autoActivate: true },
  // MMO & Marketing
  { group: "MARKETING", type: "smtp-server", label: "SMTP Server" },
  { group: "MARKETING", type: "transactional-email", label: "Transactional Email", autoActivate: true },
  { group: "MARKETING", type: "bulk-mail", label: "Bulk Mail Server" },
  { group: "MARKETING", type: "sms-gateway", label: "SMS Gateway", autoActivate: true },
  { group: "MARKETING", type: "short-link", label: "Short Link Service", autoActivate: true },
  { group: "MARKETING", type: "captcha-credits", label: "Captcha Solving Credits", autoActivate: true },
  // License Services
  { group: "LICENSE", type: "license-key", label: "License Key", autoActivate: true },
  { group: "LICENSE", type: "software-activation", label: "Software Activation", autoActivate: true },
  { group: "LICENSE", type: "subscription", label: "Subscription Service", autoActivate: true },
  { group: "LICENSE", type: "api-subscription", label: "API Access Subscription", autoActivate: true },
];

const TYPE_BY_SLUG = new Map(PRODUCT_TYPES.map((t) => [t.type, t]));
const GROUP_BY_ID = new Map(PRODUCT_GROUPS.map((g) => [g.id, g]));

export function isKnownType(slug: string): boolean { return TYPE_BY_SLUG.has(slug); }
export function isKnownGroup(id: string): boolean { return GROUP_BY_ID.has(id); }
export function typeLabel(slug: string): string { return TYPE_BY_SLUG.get(slug)?.label || slug; }
export function groupLabel(id: string): string { return GROUP_BY_ID.get(id)?.label || id; }
export function groupOfType(slug: string): string { return TYPE_BY_SLUG.get(slug)?.group || ""; }
export function typeAutoActivates(slug: string): boolean { return !!TYPE_BY_SLUG.get(slug)?.autoActivate; }

/** Per-cycle price for a product (yearly price wins for ANNUAL when set). */
export function cyclePrice(p: { priceMonthly: any; priceYearly: any }, cycle: string): number {
  const months = CYCLE_MONTHS[cycle] || 1;
  if (cycle === "ANNUAL" && p.priceYearly) return Number(p.priceYearly);
  return Number(p.priceMonthly) * months;
}

const GROUP_FLAG = (groupId: string) => `sell_group_${groupId}`;

/** Whether a taxonomy group is currently offered for sale (default on). */
export async function isGroupSellable(groupId: string): Promise<boolean> {
  const key = GROUP_FLAG(groupId);
  const s = await getSettings([key]);
  return (s[key] ?? "true") !== "false";
}

/** On/off map for every catalog group plus the legacy integrated modules. */
export async function getCatalogToggles(): Promise<Record<string, boolean>> {
  const groupKeys = PRODUCT_GROUPS.map((g) => GROUP_FLAG(g.id));
  const legacy = ["sell_vps", "sell_hosting", "sell_domain"];
  const s = await getSettings([...groupKeys, ...legacy]);
  const out: Record<string, boolean> = {};
  for (const k of [...groupKeys, ...legacy]) out[k] = (s[k] ?? "true") !== "false";
  return out;
}

/** Max number of cronjobs allowed by a cronjob order's product specs. */
export function cronjobLimit(specs: any): number {
  const n = parseInt(specs?.maxJobs ?? specs?.jobs ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 5;
}
