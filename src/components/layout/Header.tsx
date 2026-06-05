"use client";
import { useState } from "react";
import Link from "next/link";
import { useAppearance } from "@/components/AppearanceProvider";

export default function Header({ title }: { title?: string }) {
  const [showNotif, setShowNotif] = useState(false);
  const { appearance, update } = useAppearance();

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
        <button onClick={() => update({ theme: appearance.theme === "dark" ? "light" : "dark" })} aria-label="Đổi giao diện sáng/tối" title="Sáng / Tối" style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "transparent", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}
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
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Thông báo</span>
                <button style={{ fontSize: 11, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>Đọc tất cả</button>
              </div>
              {[
                { title: "Nạp tiền thành công", desc: "+500,000đ vào ví", time: "2 phút trước", color: "var(--green)" },
                { title: "VPS sắp hết hạn", desc: "VPS #1234 hết hạn sau 3 ngày", time: "1 giờ trước", color: "var(--yellow)" },
                { title: "Ticket #45 đã phản hồi", desc: "Admin đã trả lời ticket của bạn", time: "3 giờ trước", color: "var(--accent)" },
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
              <Link href="/notifications" style={{ display: "block", padding: "12px", textAlign: "center", fontSize: 12, color: "var(--accent)", textDecoration: "none" }}>
                Xem tất cả thông báo
              </Link>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />

        {/* Avatar */}
        <Link href="/settings/profile" style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: "var(--radius-md)", textDecoration: "none", transition: "background 0.12s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
        >
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#4f7cff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white" }}>A</div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>Admin</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
        </Link>
      </div>
    </header>
  );
}
