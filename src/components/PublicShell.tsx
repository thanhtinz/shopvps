"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

export type PublicContact = {
  email?: string;
  phone?: string;
  zalo?: string;
  discord?: string;
  address?: string;
};

const C = {
  bg: "#080b12",
  card: "rgba(13,17,23,0.8)",
  border: "rgba(255,255,255,0.07)",
  borderHover: "rgba(79,124,255,0.3)",
  text: "#e8edf5",
  muted: "#8896aa",
  faint: "#4a5568",
  blue: "#4f7cff",
  purple: "#7c3aed",
  grad: "linear-gradient(135deg,#4f7cff,#7c3aed)",
};

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        background: C.grad,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 4px 16px rgba(79,124,255,0.35)",
      }}
    >
      <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20M5 19v-4M19 19v-4" />
      </svg>
    </div>
  );
}

export default function PublicShell({
  children,
  appName,
  contact,
  onLanding = false,
}: {
  children: React.ReactNode;
  appName: string;
  contact?: PublicContact;
  onLanding?: boolean;
}) {
  const { t, locale, setLocale } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const ct = contact || {};

  const anchor = (id: string) => (onLanding ? `#${id}` : `/#${id}`);

  const navLinks = [
    { label: t("Tính năng"), href: anchor("features") },
    { label: t("Bảng giá"), href: anchor("pricing") },
    { label: t("FAQ"), href: "/faq" },
    { label: t("Liên hệ"), href: "/contact" },
  ];

  const productLinks = [
    { label: t("VPS"), href: "/register" },
    { label: t("Hosting"), href: "/register" },
    { label: t("Tên miền"), href: "/register" },
    { label: t("SSL"), href: "/register" },
    { label: t("Game Hosting"), href: "/register" },
  ];
  const companyLinks = [
    { label: t("FAQ"), href: "/faq" },
    { label: t("Liên hệ"), href: "/contact" },
    { label: t("Trạng thái"), href: "/status" },
  ];
  const legalLinks = [
    { label: t("Điều khoản sử dụng"), href: "/terms" },
    { label: t("Chính sách bảo mật"), href: "/privacy" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        .psh-burger { display: none; }
        @media (max-width: 860px) {
          .psh-desktop { display: none !important; }
          .psh-burger { display: inline-flex !important; }
        }
        @media (min-width: 861px) { .psh-mobile { display: none !important; } }
      `}</style>
      {/* Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: `1px solid ${C.border}`,
          padding: "0 clamp(16px,4vw,48px)",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(8,11,18,0.72)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: C.text }}>
          <LogoMark />
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em" }}>{appName}</span>
        </Link>

        <div className="psh-desktop" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div className="psh-navlinks" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {navLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                style={{ padding: "8px 12px", borderRadius: 8, color: C.muted, textDecoration: "none", fontSize: 14, fontWeight: 500 }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <button
            onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
            title={t("Đổi ngôn ngữ")}
            style={{
              padding: "7px 10px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${C.border}`,
              color: C.muted,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: "pointer",
              marginRight: 4,
            }}
          >
            {locale === "vi" ? "EN" : "VI"}
          </button>

          <Link href="/login" style={{ padding: "8px 14px", borderRadius: 8, color: C.text, textDecoration: "none", fontSize: 14, fontWeight: 500 }}>
            {t("Đăng nhập")}
          </Link>
          <Link
            href="/register"
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              background: C.grad,
              color: "white",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
              boxShadow: "0 4px 16px rgba(79,124,255,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            {t("Đăng ký miễn phí")}
          </Link>
        </div>

        {/* Mobile burger */}
        <button
          className="psh-burger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          style={{ alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.text, cursor: "pointer" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </nav>

      {/* Mobile menu panel */}
      {menuOpen && (
        <div className="psh-mobile" style={{ position: "sticky", top: 64, zIndex: 49, background: "rgba(8,11,18,0.97)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.border}`, padding: "12px clamp(16px,4vw,48px) 18px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navLinks.map((l) => (
            <Link key={l.label} href={l.href} onClick={() => setMenuOpen(false)} style={{ padding: "11px 8px", borderRadius: 8, color: C.muted, textDecoration: "none", fontSize: 15, fontWeight: 500, borderBottom: `1px solid ${C.border}` }}>
              {l.label}
            </Link>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <Link href="/login" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: "center", padding: "11px", borderRadius: 9, border: `1px solid ${C.border}`, color: C.text, textDecoration: "none", fontSize: 14, fontWeight: 600 }}>
              {t("Đăng nhập")}
            </Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} style={{ flex: 1, textAlign: "center", padding: "11px", borderRadius: 9, background: C.grad, color: "white", textDecoration: "none", fontSize: 14, fontWeight: 700 }}>
              {t("Đăng ký miễn phí")}
            </Link>
          </div>
          <button onClick={() => { setLocale(locale === "vi" ? "en" : "vi"); }} style={{ marginTop: 8, padding: "10px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {locale === "vi" ? "English" : t("Tiếng Việt")}
          </button>
        </div>
      )}

      <div style={{ flex: 1 }}>{children}</div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "56px clamp(16px,4vw,48px) 32px", marginTop: 64 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 40 }}>
            {/* Brand col */}
            <div style={{ minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <LogoMark size={28} />
                <span style={{ fontWeight: 800, fontSize: 16 }}>{appName}</span>
              </div>
              <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.7, maxWidth: 260 }}>
                {t("Hạ tầng VPS, Hosting, Tên miền, SSL & Game — quản lý tất cả từ một nơi.")}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 16 }}>
                {ct.email ? (
                  <a href={`mailto:${ct.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: C.muted, textDecoration: "none" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" /></svg>
                    {ct.email}
                  </a>
                ) : null}
                {ct.phone ? (
                  <a href={`tel:${ct.phone}`} style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: C.muted, textDecoration: "none" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" /></svg>
                    {ct.phone}
                  </a>
                ) : null}
                {ct.zalo ? <span style={{ fontSize: 13, color: C.muted }}>Zalo: {ct.zalo}</span> : null}
                {ct.discord ? <span style={{ fontSize: 13, color: C.muted }}>Discord: {ct.discord}</span> : null}
              </div>
            </div>

            <FooterCol title={t("Sản phẩm")} links={productLinks} />
            <FooterCol title={t("Công ty")} links={companyLinks} />
            <FooterCol title={t("Pháp lý")} links={legalLinks} />
          </div>

          <div
            style={{
              marginTop: 40,
              paddingTop: 24,
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12.5, color: C.faint }}>
              © 2026 {appName}. {t("Bảo lưu mọi quyền.")}
            </span>
            <span style={{ fontSize: 12.5, color: C.faint }}>{t("Xây dựng cho thị trường Việt Nam.")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {links.map((l) => (
          <Link key={l.label} href={l.href} style={{ fontSize: 13.5, color: C.muted, textDecoration: "none" }}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export { C as SHELL_COLORS, LogoMark };
