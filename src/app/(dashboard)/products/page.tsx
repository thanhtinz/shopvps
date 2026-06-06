"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

type Order = {
  id: string;
  label: string;
  group: string;
  category: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "TERMINATED";
  billingCycle: string;
  price: number;
  createdAt: string;
  expiresAt: string | null;
  product: { name: string; category: string; group: string; specs: any };
};

export default function ProductsPage() {
  const { t } = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeLabels, setTypeLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/products/orders").then(r => r.json()).then(d => {
      setOrders(d.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/products/taxonomy").then(r => r.json()).then(d => {
      const types: Array<{ type: string; label: string }> = d.data?.types || [];
      const tl: Record<string, string> = {};
      for (const ty of types) tl[ty.type] = ty.label;
      setTypeLabels(tl);
    }).catch(() => {});
  }, []);

  const typeLabel = (slug: string) => typeLabels[slug] || slug;

  const statusColor: Record<string, "green" | "yellow" | "gray" | "red"> = { ACTIVE: "green", PENDING: "yellow", SUSPENDED: "gray", TERMINATED: "red" };
  const statusLabel: Record<string, string> = { ACTIVE: t("Đang hoạt động"), PENDING: t("Chờ kích hoạt"), SUSPENDED: t("Tạm dừng"), TERMINATED: t("Đã huỷ") };

  if (loading) return <div style={{ maxWidth: 900, margin: "0 auto" }}><div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-lg)" }} /></div>;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 20 }}>{t("Dịch vụ khác")} ({orders.length})</h1>

      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><path d="M6 6h.01M6 18h.01" /></svg></div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>{t("Chưa có dịch vụ nào")}</h3>
          <Link href="/store" style={{ display: "inline-block", marginTop: 6, padding: "8px 16px", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>{t("Đến cửa hàng")}</Link>
        </div>
      ) : (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[t("Dịch vụ"), t("Loại"), t("Trạng thái"), t("Giá"), t("Hết hạn"), ""].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{o.product?.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{o.label}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><Badge color="blue">{typeLabel(o.category)}</Badge></td>
                  <td style={{ padding: "12px 16px" }}><Badge color={statusColor[o.status] || "gray"}>{statusLabel[o.status] || o.status}</Badge></td>
                  <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{formatCurrency(o.price)}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{o.expiresAt ? formatDate(o.expiresAt) : "—"}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <Link href={`/products/${o.id}`} style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 12, textDecoration: "none" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--accent)"; (e.currentTarget as HTMLElement).style.color = "var(--accent)"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)"; }}
                      >
                        {t("Quản lý")}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
