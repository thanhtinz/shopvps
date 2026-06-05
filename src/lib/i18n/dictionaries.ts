export type Locale = "vi" | "en";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "vi", label: "Tiếng Việt" },
  { code: "en", label: "English" },
];

// Flat key → string maps. Add keys here and use t("key") in components.
// Missing keys fall back to Vietnamese, then to the key itself, so the app
// keeps working while strings are translated incrementally.
const vi: Record<string, string> = {
  "section.services": "Dịch vụ",
  "section.finance": "Tài chính",
  "section.manage": "Quản lý",
  "section.system": "Hệ thống",
  "nav.dashboard": "Tổng quan",
  "nav.vps": "VPS",
  "nav.hosting": "Hosting",
  "nav.domains": "Tên miền",
  "nav.wallet": "Ví & Nạp tiền",
  "nav.invoices": "Hoá đơn",
  "nav.support": "Hỗ trợ",
  "nav.kb": "Kiến thức",
  "nav.downloads": "Tải xuống",
  "nav.team": "Team",
  "nav.affiliate": "Affiliate",
  "nav.settings": "Cài đặt",
  "settings.title": "Cài đặt tài khoản",
  "settings.tab.profile": "Thông tin",
  "settings.tab.appearance": "Giao diện",
  "settings.tab.security": "Bảo mật",
  "settings.tab.2fa": "Xác thực 2 lớp",
  "appearance.mode": "Chế độ",
  "appearance.dark": "Tối",
  "appearance.light": "Sáng",
  "appearance.accent": "Màu nhấn",
  "appearance.font": "Phông chữ",
  "appearance.fontSize": "Cỡ chữ",
  "appearance.direction": "Hướng bố cục",
  "appearance.language": "Ngôn ngữ",
  "appearance.reset": "Khôi phục mặc định",
  "header.themeToggle": "Sáng / Tối",
  "common.save": "Lưu thay đổi",
  "common.cancel": "Huỷ",
};

const en: Record<string, string> = {
  "section.services": "Services",
  "section.finance": "Billing",
  "section.manage": "Management",
  "section.system": "System",
  "nav.dashboard": "Overview",
  "nav.vps": "VPS",
  "nav.hosting": "Hosting",
  "nav.domains": "Domains",
  "nav.wallet": "Wallet & Top-up",
  "nav.invoices": "Invoices",
  "nav.support": "Support",
  "nav.kb": "Knowledgebase",
  "nav.downloads": "Downloads",
  "nav.team": "Team",
  "nav.affiliate": "Affiliate",
  "nav.settings": "Settings",
  "settings.title": "Account settings",
  "settings.tab.profile": "Profile",
  "settings.tab.appearance": "Appearance",
  "settings.tab.security": "Security",
  "settings.tab.2fa": "Two-factor",
  "appearance.mode": "Mode",
  "appearance.dark": "Dark",
  "appearance.light": "Light",
  "appearance.accent": "Accent color",
  "appearance.font": "Font",
  "appearance.fontSize": "Font size",
  "appearance.direction": "Layout direction",
  "appearance.language": "Language",
  "appearance.reset": "Reset to default",
  "header.themeToggle": "Light / Dark",
  "common.save": "Save changes",
  "common.cancel": "Cancel",
};

const DICTS: Record<Locale, Record<string, string>> = { vi, en };

export function translate(locale: Locale, key: string): string {
  return DICTS[locale]?.[key] ?? DICTS.vi[key] ?? key;
}

export const LOCALE_BOOT_SCRIPT = `(function(){try{var l=localStorage.getItem("locale");if(l)document.documentElement.lang=l;}catch(e){}})();`;
