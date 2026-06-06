// Staff RBAC. SUPER_ADMIN has everything; an ADMIN is restricted to the module
// keys stored in User.adminPermissions. Enforced centrally in middleware.ts.

export const ADMIN_MODULES: { key: string; label: string }[] = [
  { key: "users", label: "Người dùng" },
  { key: "orders", label: "Đơn hàng & yêu cầu" },
  { key: "finance", label: "Tài chính (hoá đơn, giao dịch, payout, thuế)" },
  { key: "reports", label: "Báo cáo" },
  { key: "products", label: "Sản phẩm & bậc giá" },
  { key: "vps", label: "VPS (provider, gói)" },
  { key: "hosting", label: "Hosting (server, gói)" },
  { key: "domains", label: "Tên miền & TLD" },
  { key: "games", label: "Game hosting" },
  { key: "support", label: "Hỗ trợ (ticket, phòng ban)" },
  { key: "security", label: "Bảo mật (gian lận, blocklist)" },
  { key: "marketing", label: "Marketing (email, coupon, KB, quà tặng)" },
  { key: "settings", label: "Cài đặt hệ thống" },
];

// Admin path segment -> module key. Unmapped segments fall through (fail-open).
const SEGMENT_MODULE: Record<string, string> = {
  users: "users", staff: "users",
  orders: "orders", "product-orders": "orders", quotes: "orders", "service-requests": "orders",
  invoices: "finance", transactions: "finance", "tax-rules": "finance", payouts: "finance",
  commissions: "finance", currencies: "finance", revenue: "finance", export: "finance",
  reports: "reports",
  products: "products", addons: "products", catalog: "products", tiers: "products", "config-options": "products",
  providers: "vps", "vps-packages": "vps", vps: "vps",
  "hosting-packages": "hosting", servers: "hosting", hosting: "hosting",
  domains: "domains", tlds: "domains",
  games: "games",
  tickets: "support", departments: "support",
  fraud: "security", blocklist: "security",
  "email-marketing": "marketing", announcements: "marketing", "email-templates": "marketing",
  kb: "marketing", downloads: "marketing", "gift-codes": "marketing", coupons: "marketing",
  "deposit-bonus": "marketing",
  "payment-gateways": "settings", settings: "settings", "api-keys": "settings",
  "activity-log": "settings", status: "settings", license: "settings",
};

/** Resolve the module a given admin path belongs to, or null when unmapped. */
export function moduleForPath(pathname: string): string | null {
  const m = pathname.match(/^\/(?:api\/)?admin\/([^/?]+)/);
  if (!m) return null; // /admin dashboard itself
  return SEGMENT_MODULE[m[1]] || null;
}

/** Whether a role + permission set may access a path. */
export function canAccessPath(role: string, perms: string[], pathname: string): boolean {
  if (role === "SUPER_ADMIN") return true;
  if (role !== "ADMIN") return false;
  const mod = moduleForPath(pathname);
  if (!mod) return true; // unmapped admin path (e.g. dashboard) — allow basic access
  return perms.includes(mod);
}
