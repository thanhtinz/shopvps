"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useAppearance } from "@/components/AppearanceProvider";
import { useLocale } from "@/components/LocaleProvider";

export default function Header({ title }: { title?: string }) {
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const { appearance, update } = useAppearance();
  const { t } = useLocale();

  useEffect(() => {
    fetch("/api/user/profile").then(r => r.json()).then(d => setUser(d.data || null)).catch(() => {});
  }, []);

  const displayName = user?.name || user?.email?.split("@")[0] || "—";
  const initial = (displayName[0] || "U").toUpperCase();

  return (
    <header style={{
      height: "var(--header-h)", background: "var(--bg-surface)",
      borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center",
      padding: "0 24px", gap: 16, flexShrink: 0,
    }}>
      <div style={{ flex: 1 }}>
        {title && <h1 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{title}</h1>}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {/* Theme toggle */}
        <button onClick={() => update({ theme: appearance.theme === "dark" ? "light" : "dark" })} aria-label={t("Đổi giao diện sáng/tối")} title={t("Sáng / Tối")} style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "transparent", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
        >
          {appearance.theme === "dark"
            ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/><circle cx="12" cy="12" r="4"/></svg>
            : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>}
        </button>

        {/* Search */}
        <button style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "transparent", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowNotif(!showNotif)} style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "transparent", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", position: "relative" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0"/></svg>
            <span style={{ position: "absolute", top: 5, right: 5, width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", border: "1.5px solid var(--bg-surface)" }} />
          </button>

          {showNotif && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 8px)",
              width: 300, background: "var(--bg-elevated)",
              border: "1px solid var(--border)", borderRadius: "var(--radius-lg)",
              boxShadow: "0 16px 40px rgba(0,0,0,0.4)", zIndex: 100,
              overflow: "hidden",
            }}>
              <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{t("Thông báo")}</span>
                <button style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>{t("Đọc tất cả")}</button>
              </div>
              {[
                { title: t("Nạp tiền thành công"), desc: t("+500,000đ vào ví"), time: t("2 phút trước"), color: "var(--green)" },
                { title: t("VPS sắp hết hạn"), desc: t("VPS #1234 hết hạn sau 3 ngày"), time: t("1 giờ trước"), color: "var(--yellow)" },
                { title: t("Ticket #45 đã phản hồi"), desc: t("Admin đã trả lời ticket của bạn"), time: t("3 giờ trước"), color: "var(--accent)" },
              ].map((n, i) => (
                <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.color, marginTop: 4, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{n.desc}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                </div>
              ))}
              <Link href="/tickets" onClick={() => setShowNotif(false)} style={{ display: "block", padding: "12px", textAlign: "center", fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                {t("Xem tất cả thông báo")}
              </Link>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />

        {/* User menu */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowUser(s => !s)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: "var(--radius-md)", background: "transparent", border: "none", cursor: "pointer", transition: "background 0.12s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4f7cff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white" }}>{initial}</div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} className="hdr-username">{displayName}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
          </button>

          {showUser && (
            <>
              <div onClick={() => setShowUser(false)} style={{ position: "fixed", inset: 0, zIndex: 90 }} />
              <div style={{ position: "absolute", right: 0, top: "calc(100% + 8px)", width: 220, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", boxShadow: "0 16px 40px rgba(0,0,0,0.4)", zIndex: 100, overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
                  {user?.email && <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>}
                </div>
                {[{ href: "/settings", label: t("Cài đặt tài khoản"), icon: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4" },
                  { href: "/wallet", label: t("Ví & Nạp tiền"), icon: "M20 12V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h6 M16 16h6 M19 13v6" },
                  { href: "/tickets", label: t("Hỗ trợ"), icon: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" }].map(it => (
                  <Link key={it.href} href={it.href} onClick={() => setShowUser(false)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", fontSize: 13, color: "var(--text-secondary)", textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{it.icon.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}</svg>
                    {it.label}
                  </Link>
                ))}
                <button onClick={() => signOut({ callbackUrl: "/login" })} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", fontSize: 13, color: "var(--red)", background: "none", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", textAlign: "left" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9" /></svg>
                  {t("Đăng xuất")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
