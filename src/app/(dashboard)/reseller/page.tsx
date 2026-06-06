"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const ENDPOINTS: { m: string; path: string; desc: string }[] = [
  { m: "GET", path: "/api/reseller/me", desc: "Số dư ví + bậc giá của bạn" },
  { m: "GET", path: "/api/reseller/products", desc: "Danh mục sản phẩm kèm giá theo bậc của bạn (?group=)" },
  { m: "POST", path: "/api/reseller/orders", desc: "Đặt đơn: { productId, billingCycle, label?, config? }" },
  { m: "GET", path: "/api/reseller/orders", desc: "Danh sách đơn của bạn" },
  { m: "GET", path: "/api/reseller/orders/{id}", desc: "Chi tiết đơn + thông tin truy cập" },
];

export default function ResellerPage() {
  const { t } = useLocale();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/user/api-keys").then(r => r.json()).then(d => { setKeys(d.data || []); setLoading(false); });
  }, []);

  const code = { background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-secondary)", overflowX: "auto" as const, whiteSpace: "pre" as const };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 8 }}>{t("Reseller API")}</h1>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>{t("Tích hợp đặt hàng tự động qua API. Giá theo bậc của bạn, trừ vào số dư ví. Tất cả tự động.")}</p>

      {/* API keys */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{t("API key của bạn")}</h3>
      {loading ? <div className="skeleton" style={{ height: 80, borderRadius: "var(--radius-lg)" }} /> : keys.length === 0 ? (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: 16, fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
          {t("Bạn chưa có API key. Vui lòng liên hệ quản trị viên để được cấp.")}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {keys.map(k => (
            <div key={k.id} style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{k.name} {k.isActive ? <Badge color="green">{t("Đang bật")}</Badge> : <Badge color="gray">{t("Tắt")}</Badge>}</div>
                <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--accent)" }}>{k.key}</code>
              </div>
              <button onClick={() => navigator.clipboard?.writeText(k.key)} style={{ padding: "6px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer" }}>{t("Sao chép")}</button>
            </div>
          ))}
        </div>
      )}

      {/* Auth */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>{t("Xác thực")}</h3>
      <div style={code as any}>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  ${origin}/api/reseller/products`}</div>

      {/* Endpoints */}
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "24px 0 10px" }}>{t("Các endpoint")}</h3>
      <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
        {ENDPOINTS.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 12, padding: "11px 14px", borderBottom: i < ENDPOINTS.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: e.m === "POST" ? "var(--green)" : "var(--accent)", minWidth: 42 }}>{e.m}</span>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-primary)" }}>{e.path}</code>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{t(e.desc)}</span>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", margin: "24px 0 10px" }}>{t("Ví dụ đặt hàng")}</h3>
      <div style={code as any}>{`curl -X POST ${origin}/api/reseller/orders \\\n  -H "Authorization: Bearer YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"productId":"...","billingCycle":"MONTHLY","label":"proxy-01"}'`}</div>
    </div>
  );
}
