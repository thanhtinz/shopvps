"use client";
import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";
import { useCart } from "@/components/CartProvider";

const CYCLE_MONTHS: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };

type ItemState = { status: "done" | "error"; error?: string };

export default function CartPage() {
  const { t } = useLocale();
  const { items, remove, clear } = useCart();
  const [processing, setProcessing] = useState(false);
  const [states, setStates] = useState<Record<string, ItemState>>({});
  const [banner, setBanner] = useState<"success" | "partial" | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discounts: Record<string, number>; total: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  const cycleLabel: Record<string, string> = {
    MONTHLY: t("1 tháng"),
    QUARTERLY: t("3 tháng"),
    SEMI_ANNUAL: t("6 tháng"),
    ANNUAL: t("1 năm"),
  };

  const lineTotal = (it: typeof items[number]) => it.priceMonthly * (CYCLE_MONTHS[it.cycle] || 1);
  const grandTotal = items.reduce((s, it) => s + lineTotal(it), 0);
  const discountTotal = coupon ? items.reduce((s, it) => s + (coupon.discounts[it.key] || 0), 0) : 0;
  const payable = Math.max(0, grandTotal - discountTotal);

  // Discounts are tied to the exact cart contents, so clear the coupon whenever
  // an item is removed and validate it again per-line against the new cart.
  function removeItem(key: string) {
    remove(key);
    if (coupon) { setCoupon(null); setCouponError(""); }
  }

  async function applyCoupon() {
    if (!couponCode.trim() || couponBusy || items.length === 0) return;
    setCouponBusy(true); setCouponError(""); setCoupon(null);
    const discounts: Record<string, number> = {};
    let lastError = "";
    for (const it of items) {
      try {
        const res = await fetch("/api/wallet/coupon", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: couponCode.trim(), orderAmount: lineTotal(it), productType: it.type === "vps" ? "VPS" : "HOSTING", packageId: it.packageId }),
        });
        const data = await res.json().catch(() => ({}));
        if (data.valid && data.data?.discount > 0) discounts[it.key] = data.data.discount;
        else if (data.error) lastError = data.error;
      } catch { /* ignore a single line failure */ }
    }
    const total = Object.values(discounts).reduce((s, d) => s + d, 0);
    if (total > 0) setCoupon({ code: couponCode.trim().toUpperCase(), discounts, total });
    else setCouponError(lastError || t("Mã không áp dụng cho sản phẩm này"));
    setCouponBusy(false);
  }

  async function checkout() {
    if (processing || items.length === 0) return;
    setProcessing(true);
    setBanner(null);
    const next: Record<string, ItemState> = {};
    let anyFailed = false;

    for (const it of [...items]) {
      const url = it.type === "vps" ? "/api/vps/order" : "/api/hosting/order";
      const useCoupon = coupon && coupon.discounts[it.key] > 0 ? coupon.code : undefined;
      const body =
        it.type === "vps"
          ? { packageId: it.packageId, os: it.config.os, region: it.config.region, hostname: it.config.hostname, billingCycle: it.cycle, couponCode: useCoupon, options: it.config.options }
          : { packageId: it.packageId, domain: it.config.domain, billingCycle: it.cycle, couponCode: useCoupon, options: it.config.options };
      try {
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          next[it.key] = { status: "done" };
          remove(it.key);
        } else {
          anyFailed = true;
          next[it.key] = { status: "error", error: data.error || t("Đặt hàng thất bại") };
        }
      } catch {
        anyFailed = true;
        next[it.key] = { status: "error", error: t("Đặt hàng thất bại") };
      }
      setStates((prev) => ({ ...prev, ...next }));
    }

    setProcessing(false);
    setBanner(anyFailed ? "partial" : "success");
  }

  const card = { background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" } as const;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", marginBottom: 20 }}>
        {t("Giỏ hàng")} ({items.length})
      </h1>

      {banner === "success" && (
        <div style={{ marginBottom: 20, padding: "16px 18px", background: "var(--green-soft)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: "var(--radius-md)", color: "var(--text-primary)" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--green)", marginBottom: 8 }}>{t("Đặt hàng thành công!")}</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[["/vps", t("VPS")], ["/hosting", t("Hosting")], ["/invoices", t("Hoá đơn")]].map(([href, label]) => (
              <Link key={href} href={href} style={{ padding: "6px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--accent)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {banner === "partial" && (
        <div style={{ marginBottom: 20, padding: "12px 16px", background: "var(--yellow-soft)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--yellow)" }}>
          {t("Một số mục chưa xử lý được, vui lòng kiểm tra số dư hoặc thông tin.")}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "80px 20px", borderRadius: "var(--radius-xl)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>{t("Giỏ hàng trống")}</h3>
          <Link href="/store" style={{ display: "inline-block", padding: "9px 18px", borderRadius: "var(--radius-md)", background: "var(--accent)", color: "white", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            {t("Đến cửa hàng")}
          </Link>
        </div>
      ) : (
        <>
          <div style={{ ...card, overflow: "hidden", marginBottom: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[t("Dịch vụ"), t("Cấu hình"), t("Chu kỳ"), t("Thành tiền"), ""].map((h, i) => (
                    <th key={i} style={{ padding: "11px 16px", textAlign: i === 3 ? "right" : "left", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const st = states[it.key];
                  const summary = it.type === "vps"
                    ? [it.config.hostname, it.config.os, it.config.region].filter(Boolean).join(" · ")
                    : it.config.domain || "—";
                  return (
                    <tr key={it.key} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)" }}>{it.packageName}</span>
                          <Badge color={it.type === "vps" ? "blue" : "purple"}>{it.type === "vps" ? "VPS" : "Hosting"}</Badge>
                          {st?.status === "done" && <span style={{ color: "var(--green)", fontSize: 14 }}>✓</span>}
                        </div>
                        {st?.status === "error" && (
                          <div style={{ marginTop: 6, fontSize: 11.5, color: "var(--red)" }}>{st.error}</div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-secondary)" }}>{summary || "—"}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{cycleLabel[it.cycle] || it.cycle}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 800, color: "var(--text-primary)", textAlign: "right", whiteSpace: "nowrap" }}>{formatCurrency(lineTotal(it))}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button onClick={() => removeItem(it.key)} disabled={processing} style={{ padding: "5px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--text-secondary)", fontSize: 12, cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.5 : 1 }}>
                          {t("Xoá")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ ...card, padding: "18px 20px" }}>
            {/* Coupon */}
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder={t("Mã giảm giá")} disabled={processing}
                style={{ flex: 1, background: "var(--bg-elevated)", border: `1.5px solid ${coupon ? "rgba(34,197,94,0.4)" : couponError ? "rgba(239,68,68,0.4)" : "var(--border)"}`, borderRadius: "var(--radius-md)", padding: "9px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: "var(--font-mono)" }} />
              <button onClick={applyCoupon} disabled={couponBusy || processing || !couponCode.trim()} style={{ padding: "9px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-elevated)", color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: couponBusy ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
                {couponBusy ? t("Đang kiểm tra...") : t("Áp dụng")}
              </button>
            </div>
            {couponError && <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 12 }}>⚠ {couponError}</div>}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: discountTotal ? 8 : 16 }}>
              <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{t("Tạm tính:")}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>{formatCurrency(grandTotal)}</span>
            </div>
            {discountTotal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 13, color: "var(--green)" }}>{t("Giảm giá")} ({coupon?.code})</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--green)" }}>−{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)" }}>{t("Tổng cộng:")}</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>{formatCurrency(payable)}</span>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>{t("Thanh toán được trừ từ số dư ví của bạn.")}</div>
            <button onClick={checkout} disabled={processing} style={{ width: "100%", padding: "12px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontWeight: 700, fontSize: 14, cursor: processing ? "not-allowed" : "pointer", opacity: processing ? 0.6 : 1 }}>
              {processing ? t("Đang xử lý...") : t("Thanh toán")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
