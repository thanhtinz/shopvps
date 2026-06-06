"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";

const nav = [
  { section: null, items: [
    { href: "/dashboard", label: "nav.dashboard", icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" },
  ]},
  { section: "section.services", items: [
    { href: "/store", label: "nav.store", icon: "M3 9l1-5h16l1 5 M4 9v11a1 1 0 001 1h14a1 1 0 001-1V9 M3 9h18 M9 13h6" },
    { href: "/vps", label: "nav.vps", icon: "M22 12H2 M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7 M2 19h20 M5 19v-4 M19 19v-4" },
    { href: "/hosting", label: "nav.hosting", icon: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" },
    { href: "/domains", label: "nav.domains", icon: "M12 2a10 10 0 100 20A10 10 0 0012 2z M2 12h20 M12 2a15 15 0 010 20 M12 2a15 15 0 000 20" },
    { href: "/products", label: "nav.products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  ]},
  { section: "section.finance", items: [
    { href: "/wallet", label: "nav.wallet", icon: "M20 12V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h6 M16 16h6 M19 13v6" },
    { href: "/invoices", label: "nav.invoices", icon: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" },
    { href: "/quotes", label: "nav.quotes", icon: "M9 11l3 3 8-8 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
    { href: "/cart", label: "nav.cart", icon: "M9 22a1 1 0 100-2 1 1 0 000 2z M20 22a1 1 0 100-2 1 1 0 000 2z M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" },
  ]},
  { section: "section.manage", items: [
    { href: "/tickets", label: "nav.support", icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" },
    { href: "/kb", label: "nav.kb", icon: "M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" },
    { href: "/downloads", label: "nav.downloads", icon: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3" },
    { href: "/team", label: "nav.team", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75" },
    { href: "/affiliate", label: "nav.affiliate", icon: "M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71 M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" },
  ]},
  { section: "section.system", items: [
    { href: "/settings", label: "nav.settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" },
  ]},
];

function NavIcon({ d }: { d: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useLocale();
  const isActive = (href: string) => href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  return (
    <aside style={{ width: "var(--sidebar-w)", height: "100%", background: "var(--bg-surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ height: "var(--header-h)", padding: "0 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#4f7cff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20M5 19v-4M19 19v-4"/></svg>
        </div>
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>ShopVPS</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "10px 8px" }}>
        {nav.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 2 }}>
            {group.section && (
              <div style={{ padding: "10px 10px 3px", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {t(group.section)}
              </div>
            )}
            {group.items.map(item => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href} onClick={onClose} style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "8px 10px",
                  borderRadius: "var(--radius-md)", marginBottom: 1, textDecoration: "none",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "var(--accent-soft)" : "transparent",
                  fontWeight: active ? 600 : 400, fontSize: 13.5, transition: "all 0.12s",
                  position: "relative",
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}}
                >
                  {active && <div style={{ position: "absolute", left: 0, top: "22%", bottom: "22%", width: 3, background: "var(--accent)", borderRadius: "0 3px 3px 0" }} />}
                  <span style={{ opacity: active ? 1 : 0.65, flexShrink: 0 }}><NavIcon d={item.icon} /></span>
                  {t(item.label)}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "10px 8px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", borderRadius: "var(--radius-md)" }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4f7cff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>A</div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)" }}>Admin</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Super Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
