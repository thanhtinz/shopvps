"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import PublicShell, { SHELL_COLORS as C, type PublicContact } from "@/components/PublicShell";

export default function ContactPage() {
  const { t } = useLocale();
  const [appName, setAppName] = useState("ShopVPS");
  const [contact, setContact] = useState<PublicContact>({});

  useEffect(() => {
    fetch("/api/landing")
      .then((r) => r.json())
      .then((j) => {
        if (j?.data?.appName) setAppName(j.data.appName);
        if (j?.data?.contact) setContact(j.data.contact);
      })
      .catch(() => {});
  }, []);

  const cards: { label: string; value?: string; href?: string; icon: string }[] = [
    { label: t("Email"), value: contact.email, href: contact.email ? `mailto:${contact.email}` : undefined, icon: "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6" },
    { label: t("Điện thoại"), value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : undefined, icon: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" },
    { label: t("Zalo"), value: contact.zalo, href: contact.zalo ? `https://zalo.me/${contact.zalo.replace(/\D/g, "")}` : undefined, icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
    { label: t("Discord"), value: contact.discord, href: contact.discord, icon: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" },
    { label: t("Địa chỉ"), value: contact.address, icon: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0zM12 13a3 3 0 100-6 3 3 0 000 6z" },
  ];
  const available = cards.filter((c) => c.value);

  return (
    <PublicShell appName={appName} contact={contact}>
      <section style={{ padding: "clamp(56px,8vw,96px) clamp(16px,4vw,48px)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ color: C.blue, fontWeight: 700, fontSize: 13.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t("Liên hệ")}</span>
            <h1 style={{ fontSize: "clamp(30px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", marginTop: 10 }}>{t("Kết nối với chúng tôi")}</h1>
            <p style={{ color: C.muted, fontSize: "clamp(15px,2vw,17px)", marginTop: 12, lineHeight: 1.7, maxWidth: 560, marginInline: "auto" }}>
              {t("Có câu hỏi trước khi bắt đầu? Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ bạn.")}
            </p>
          </div>

          {available.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
              {available.map((c) => {
                const body = (
                  <>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "linear-gradient(135deg,rgba(79,124,255,0.18),rgba(124,58,237,0.14))",
                        border: `1px solid ${C.border}`,
                        color: C.blue,
                      }}
                    >
                      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={c.icon} />
                      </svg>
                    </div>
                    <div style={{ color: C.muted, fontSize: 12.5, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 16 }}>{c.label}</div>
                    <div style={{ fontSize: 15.5, fontWeight: 600, marginTop: 4, wordBreak: "break-word" }}>{c.value}</div>
                  </>
                );
                const cardStyle = {
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: 24,
                  textDecoration: "none",
                  color: C.text,
                  display: "block",
                } as const;
                return c.href ? (
                  <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer" style={cardStyle}>
                    {body}
                  </a>
                ) : (
                  <div key={c.label} style={cardStyle}>
                    {body}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 32, textAlign: "center", color: C.muted }}>
              {t("Thông tin liên hệ đang được cập nhật.")}
            </div>
          )}

          <div
            style={{
              marginTop: 24,
              background: "linear-gradient(135deg,rgba(79,124,255,0.08),rgba(124,58,237,0.06))",
              border: `1px solid ${C.border}`,
              borderRadius: 18,
              padding: 28,
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700 }}>{t("Bạn đã là khách hàng?")}</h3>
            <p style={{ color: C.muted, fontSize: 14.5, lineHeight: 1.7, marginTop: 8, maxWidth: 520, marginInline: "auto" }}>
              {t("Để được hỗ trợ nhanh nhất, vui lòng đăng nhập và tạo ticket hỗ trợ — đội ngũ kỹ thuật sẽ phản hồi ngay trong bảng điều khiển của bạn.")}
            </p>
            <Link
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginTop: 18,
                padding: "12px 24px",
                borderRadius: 11,
                background: C.grad,
                color: "white",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: "0 6px 20px rgba(79,124,255,0.3)",
              }}
            >
              {t("Đăng nhập để tạo ticket")}
            </Link>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
