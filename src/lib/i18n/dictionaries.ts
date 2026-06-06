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
  "nav.quotes": "Báo giá",
  "nav.store": "Cửa hàng",
  "nav.cart": "Giỏ hàng",
  "nav.products": "Dịch vụ khác",
  "nav.reseller": "Reseller API",
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
  "nav.quotes": "Quotes",
  "nav.store": "Store",
  "nav.cart": "Cart",
  "nav.products": "Other services",
  "nav.reseller": "Reseller API",
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

// Merge per-group English maps (keyed by the Vietnamese literal). These are
// filled incrementally; missing keys fall back to the Vietnamese key itself.
import enCommon from "./en/common";
import enUserServices from "./en/userServices";
import enUserBilling from "./en/userBilling";
import enUserAccount from "./en/userAccount";
import enAdminCore from "./en/adminCore";
import enAdminCore2 from "./en/adminCore2";
import enAdminCatalog from "./en/adminCatalog";
import enAdminPromo from "./en/adminPromo";
import enAdminConfig from "./en/adminConfig";
import enAdminConfig2 from "./en/adminConfig2";
import enAuth from "./en/auth";
import enServerPages from "./en/serverPages";
import enApiAdmin from "./en/apiAdmin";
import enApiServices from "./en/apiServices";
import enApiMisc from "./en/apiMisc";
import enEmails from "./en/emails";
import enUiPublic from "./en/uiPublic";
import enUiMisc from "./en/uiMisc";
import enSrvNotif from "./en/srvNotif";
import enSrvMisc from "./en/srvMisc";
import enFixups from "./en/fixups";
import enBilling from "./en/billing";
import enUpgradeUi from "./en/upgradeUi";
import enQuotes from "./en/quotes";
import enQuotesUi from "./en/quotesUi";
import enQuotesAdminUi from "./en/quotesAdminUi";
import enStoreUi from "./en/storeUi";
import enCartUi from "./en/cartUi";
import enCouponsUi from "./en/couponsUi";
import enRefundUi from "./en/refundUi";
import enCancelUi from "./en/cancelUi";
import enRegistrarUi from "./en/registrarUi";
import enTaxUi from "./en/taxUi";
import enProductsUi from "./en/productsUi";
import enProductsAdminUi from "./en/productsAdminUi";
import enProductsClientUi from "./en/productsClientUi";
import enPayoutsUi from "./en/payoutsUi";
import enFraudUi from "./en/fraudUi";
import enTiersUi from "./en/tiersUi";
import enGamesUi from "./en/gamesUi";
import enDomainsUi from "./en/domainsUi";
import enStaffUi from "./en/staffUi";

Object.assign(
  DICTS.en,
  enCommon, enUserServices, enUserBilling, enUserAccount,
  enAdminCore, enAdminCore2, enAdminCatalog, enAdminPromo,
  enAdminConfig, enAdminConfig2, enAuth, enServerPages,
  enApiAdmin, enApiServices, enApiMisc, enEmails,
  enUiPublic, enUiMisc, enSrvNotif, enSrvMisc, enFixups, enBilling, enUpgradeUi,
  enQuotes, enQuotesUi, enQuotesAdminUi, enStoreUi, enCartUi, enCouponsUi, enRefundUi, enCancelUi,
  enRegistrarUi, enTaxUi, enProductsUi, enProductsAdminUi, enProductsClientUi, enPayoutsUi, enFraudUi, enTiersUi, enGamesUi, enDomainsUi, enStaffUi,
);

export function translate(locale: Locale, key: string): string {
  return DICTS[locale]?.[key] ?? DICTS.vi[key] ?? key;
}

export const LOCALE_BOOT_SCRIPT = `(function(){try{var l=localStorage.getItem("locale");if(l)document.documentElement.lang=l;}catch(e){}})();`;
