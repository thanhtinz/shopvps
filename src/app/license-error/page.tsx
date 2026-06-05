"use client";

import { useLocale } from "@/components/LocaleProvider";

export default function LicenseErrorPage() {
  const { t } = useLocale();
  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      padding: "24px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 440 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px", fontSize: 36,
        }}></div>

        <h1 style={{ color: "#f1f5f9", fontSize: 24, fontWeight: 700, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          {t("License không hợp lệ")}
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: "0 0 32px" }}>
          {t("License key của hệ thống này đã hết hạn, bị thu hồi hoặc không còn hợp lệ. Vui lòng liên hệ nhà cung cấp để được hỗ trợ.")}
        </p>

        <div style={{
          background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
          borderRadius: 12, padding: "16px 20px", marginBottom: 24, textAlign: "left",
        }}>
          <div style={{ color: "#f87171", fontSize: 12, fontWeight: 600, marginBottom: 8, letterSpacing: "0.05em" }}>
            {t("CÓ THỂ LÀ DO")}
          </div>
          {[
            t("License key đã hết hạn sử dụng"),
            t("Domain không khớp với license đã đăng ký"),
            t("License bị thu hồi do vi phạm điều khoản"),
            t("Phần cứng server thay đổi (nếu bật HW binding)"),
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
              <span style={{ color: "#475569", marginTop: 1 }}>·</span>
              <span style={{ color: "#94a3b8", fontSize: 13 }}>{item}</span>
            </div>
          ))}
        </div>

        <a
          href="mailto:support@shopvps.com"
          style={{
            display: "inline-block", padding: "12px 28px",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10, color: "#e2e8f0", fontSize: 14,
            textDecoration: "none", fontWeight: 500,
          }}
        >
          {t("Liên hệ hỗ trợ")}
        </a>
      </div>
    </div>
  );
}
