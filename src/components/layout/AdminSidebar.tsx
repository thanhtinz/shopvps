"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { canAccessPath } from "@/lib/permissions";

const nav = [
  { section: null, items: [
    { href:"/admin", label:"Dashboard", icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  ]},
  { section: "Quản lý", items: [
    { href:"/admin/users", label:"Người dùng", icon:"M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z" },
    { href:"/admin/orders", label:"Đơn hàng", icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2" },
    { href:"/admin/quotes", label:"Báo giá", icon:"M9 11l3 3 8-8 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
    { href:"/admin/invoices", label:"Quản lý hoá đơn", icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
    { href:"/admin/tax-rules", label:"Quy tắc thuế theo quốc gia", icon:"M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10 M9 8h6" },
    { href:"/admin/products", label:"Sản phẩm (Dedicated/Proxy/Cronjob)", icon:"M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { href:"/admin/product-orders", label:"Đơn sản phẩm", icon:"M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 12h6 M9 16h6" },
    { href:"/admin/payouts", label:"Rút tiền (Payouts)", icon:"M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
    { href:"/admin/fraud", label:"Chống gian lận", icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4" },
    { href:"/admin/tiers", label:"Bậc giá / Reseller", icon:"M12 2l3 7h7l-5.5 4 2 7L12 16l-6.5 4 2-7L2 9h7z" },
    { href:"/admin/games", label:"Game hosting", icon:"M6 11h4 M8 9v4 M15 12h.01 M18 10h.01 M17.32 5H6.68a4 4 0 00-3.98 3.59l-.84 8A3 3 0 004.84 20a3 3 0 002.65-1.6l.72-1.4h7.58l.72 1.4A3 3 0 0019.16 20a3 3 0 003-3.41l-.84-8A4 4 0 0017.32 5z" },
    { href:"/admin/transactions", label:"Giao dịch", icon:"M12 22V12 M12 12l-3-3 M12 12l3-3" },
    { href:"/admin/reports", label:"Báo cáo", icon:"M3 3v18h18 M7 16l4-4 3 3 5-6" },
    { href:"/admin/payment-gateways", label:"Cổng thanh toán", icon:"M1 4h22v16H1z M1 10h22" },
    { href:"/admin/currencies", label:"Tiền tệ", icon:"M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
    { href:"/admin/commissions", label:"Hoa hồng", icon:"M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
    { href:"/admin/tickets", label:"Hỗ trợ", icon:"M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { href:"/admin/service-requests", label:"Yêu cầu DV", icon:"M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
    { href:"/admin/departments", label:"Phòng ban", icon:"M3 21h18 M5 21V7l8-4v18 M19 21V11l-6-4" },
  ]},
  { section: "Sản phẩm", items: [
    { href:"/admin/providers", label:"VPS Providers", icon:"M22 12H2 M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7" },
    { href:"/admin/vps-packages", label:"Gói VPS", icon:"M2 19h20 M5 19v-4 M19 19v-4" },
    { href:"/admin/hosting-packages", label:"Gói Hosting", icon:"M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" },
    { href:"/admin/domains", label:"Tên miền", icon:"M12 2a10 10 0 100 20A10 10 0 0012 2z M2 12h20 M12 2a15 15 0 010 20 M12 2a15 15 0 000 20" },
    { href:"/admin/tlds", label:"Bảng giá TLD", icon:"M12 1v22 M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" },
    { href:"/admin/ssl-plans", label:"Gói SSL", icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" },
    { href:"/admin/ssl", label:"Chứng chỉ SSL", icon:"M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4" },
    { href:"/admin/addons", label:"Add-on", icon:"M12 2v20 M2 12h20" },
    { href:"/admin/servers", label:"WHM Servers", icon:"M2 2h20v8H2z M2 14h20v8H2z M6 6h.01 M6 18h.01" },
    { href:"/admin/coupons", label:"Coupon", icon:"M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z M7 7h.01" },
    { href:"/admin/config-options", label:"Tuỳ chọn cấu hình", icon:"M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4" },
  ]},
  { section: "Marketing", items: [
    { href:"/admin/email-marketing", label:"Email Marketing", icon:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" },
    { href:"/admin/announcements", label:"Thông báo", icon:"M3 11l18-5v12L3 14v-3z M11.6 16.8a3 3 0 11-5.8-1.6" },
    { href:"/admin/email-templates", label:"Mẫu email", icon:"M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" },
    { href:"/admin/kb", label:"Knowledgebase", icon:"M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" },
    { href:"/admin/downloads", label:"Tải xuống", icon:"M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" },
    { href:"/admin/gift-codes", label:"Mã quà tặng", icon:"M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z" },
    { href:"/admin/api-keys", label:"API Keys", icon:"M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" },
    { href:"/admin/license", label:"Giấy phép", icon:"M9 12l2 2 4-4 M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" },
  ]},
  { section: "Hệ thống", items: [
    { href:"/admin/staff", label:"Nhân viên & phân quyền", icon:"M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M22 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75", super:true },
    { href:"/admin/activity-log", label:"Activity Log", icon:"M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8" },
    { href:"/admin/settings", label:"Cài đặt", icon:"M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4" },
  ]},
];

function NavIcon({ d }: { d: string }) {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p,i)=><path key={i} d={i===0?p:"M"+p}/>)}</svg>;
}

export default function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const [me, setMe] = useState<{ role: string; adminPermissions: string[] } | null>(null);
  useEffect(() => { fetch("/api/admin/me").then(r => r.json()).then(d => d.success && setMe(d.data)).catch(() => {}); }, []);
  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  // Hide nav the current admin can't reach. Super-only items (e.g. staff RBAC)
  // are visible to SUPER_ADMIN only.
  const role = me?.role || "";
  const perms = me?.adminPermissions || [];
  const canSee = (item: any) => {
    if (role === "SUPER_ADMIN") return true;
    if (item.super) return false;
    return canAccessPath(role, perms, item.href);
  };
  const visibleNav = nav
    .map(g => ({ ...g, items: g.items.filter(canSee) }))
    .filter(g => g.items.length > 0);

  return (
    <aside style={{ width:"var(--sidebar-w)", height:"100%", background:"var(--bg-surface)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", flexShrink:0 }}>
      <div style={{ height:"var(--header-h)", padding:"0 16px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid var(--border)" }}>
        <div style={{ width:30, height:30, borderRadius:8, background:"linear-gradient(135deg,#ef4444,#dc2626)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9 M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        </div>
        <div>
          <div style={{ fontWeight:800, fontSize:14, color:"var(--text-primary)", letterSpacing:"-0.02em" }}>Admin Panel</div>
          <div style={{ fontSize:10, color:"var(--text-muted)" }}>ShopVPS</div>
        </div>
      </div>
      <nav style={{ flex:1, overflowY:"auto", padding:"10px 8px" }}>
        {visibleNav.map((g, gi) => (
          <div key={gi} style={{ marginBottom:2 }}>
            {g.section && <div style={{ padding:"10px 10px 3px", fontSize:10, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.1em", textTransform:"uppercase" }}>{t(g.section)}</div>}
            {g.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={onClose} style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:"var(--radius-md)", marginBottom:1, textDecoration:"none", color:active?"#ef4444":"var(--text-secondary)", background:active?"rgba(239,68,68,0.1)":"transparent", fontWeight:active?600:400, fontSize:13, transition:"all 0.12s", position:"relative" }}
                  onMouseEnter={e=>{ if(!active){(e.currentTarget as HTMLElement).style.background="var(--bg-hover)";(e.currentTarget as HTMLElement).style.color="var(--text-primary)";} }}
                  onMouseLeave={e=>{ if(!active){(e.currentTarget as HTMLElement).style.background="transparent";(e.currentTarget as HTMLElement).style.color="var(--text-secondary)";} }}
                >
                  {active && <div style={{ position:"absolute", left:0, top:"22%", bottom:"22%", width:3, background:"#ef4444", borderRadius:"0 3px 3px 0" }}/>}
                  <span style={{ opacity:active?1:0.65, flexShrink:0 }}><NavIcon d={item.icon}/></span>
                  {t(item.label)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div style={{ padding:"10px 8px", borderTop:"1px solid var(--border)" }}>
        <Link href="/dashboard" style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:"var(--radius-md)", textDecoration:"none", color:"var(--text-muted)", fontSize:12.5, transition:"background 0.12s" }}
          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          {t("Về User Dashboard")}
        </Link>
      </div>
    </aside>
  );
}
