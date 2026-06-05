"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import AddonPicker from "@/components/AddonPicker";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}</svg>;
}

const CYCLES = [
  { key: "MONTHLY", label: "1 tháng", discount: null },
  { key: "QUARTERLY", label: "3 tháng", discount: "5%" },
  { key: "SEMI_ANNUAL", label: "6 tháng", discount: "10%" },
  { key: "ANNUAL", label: "1 năm", discount: "20%" },
];

export default function BuyHostingPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<string>("MONTHLY");
  const [domain, setDomain] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [addonMonthly, setAddonMonthly] = useState(0);

  useEffect(() => {
    fetch("/api/hosting/packages").then(r => r.json()).then(p => { setPackages(p.data || []); setLoading(false); });
  }, []);

  const pkg = packages.find(p => p.id === selectedPkg);

  function getPrice() {
    if (!pkg) return 0;
    const m: Record<string, number> = { MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 };
    if (billingCycle === "ANNUAL" && pkg.priceYearly) return Number(pkg.priceYearly);
    return Number(pkg.priceMonthly) * (m[billingCycle] || 1);
  }

  const months = ({ MONTHLY: 1, QUARTERLY: 3, SEMI_ANNUAL: 6, ANNUAL: 12 } as Record<string, number>)[billingCycle] || 1;
  const basePrice = getPrice() + addonMonthly * months;
  const discount = couponResult?.data?.discount || 0;
  const finalPrice = Math.max(0, basePrice - discount);

  async function checkCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponResult(null);
    const res = await fetch("/api/wallet/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponCode, orderAmount: basePrice }) });
    setCouponResult(await res.json()); setCouponLoading(false);
  }

  async function order() {
    if (!selectedPkg) { setError("Vui lòng chọn gói hosting"); return; }
    if (!domain.trim()) { setError("Vui lòng nhập tên miền"); return; }
    setOrdering(true); setError("");
    const res = await fetch("/api/hosting/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId: selectedPkg, domain: domain.trim().toLowerCase(), billingCycle, couponCode: couponResult?.valid ? couponCode : undefined, addonIds }) });
    const data = await res.json();
    if (data.success) { router.push("/hosting"); }
    else { setError(data.error || "Đã có lỗi xảy ra"); setOrdering(false); }
  }

  if (loading) return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: "var(--radius-lg)", marginBottom: 14 }} />)}
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button onClick={() => router.back()} style={{ width: 34, height: 34, borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)", cursor: "pointer" }}>
          <Icon d="M19 12H5 M12 19l-7-7 7-7" />
        </button>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em" }}>Mua Hosting mới</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Chọn gói và thanh toán từ ví</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>
        <div>
          {/* Packages */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Chọn gói Hosting</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {packages.map(p => (
                <div key={p.id} onClick={() => setSelectedPkg(p.id)} style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
                  borderRadius: "var(--radius-md)", border: `1.5px solid ${selectedPkg === p.id ? "var(--accent)" : "var(--border)"}`,
                  background: selectedPkg === p.id ? "var(--accent-soft)" : "var(--bg-elevated)", cursor: "pointer", transition: "all 0.12s",
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selectedPkg === p.id ? "var(--accent)" : "var(--border)"}`, background: selectedPkg === p.id ? "var(--accent)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {selectedPkg === p.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>{p.storage} MB Disk</span>
                      <span>{p.bandwidth === 0 ? "∞ BW" : p.bandwidth + " MB BW"}</span>
                      <span>{p.databases === 0 ? "∞" : p.databases} DB</span>
                      <span>{p.emailAccounts === 0 ? "∞" : p.emailAccounts} Email</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>{p.server?.name}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: selectedPkg === p.id ? "var(--accent)" : "var(--text-primary)", flexShrink: 0 }}>{formatCurrency(p.priceMonthly)}<span style={{ fontSize: 11, fontWeight: 400 }}>/tháng</span></div>
                </div>
              ))}
              {packages.length === 0 && <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: 13 }}>Không có gói nào</div>}
            </div>
          </div>

          {/* Billing cycle */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px", marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Chu kỳ thanh toán</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
              {CYCLES.map(c => (
                <button key={c.key} onClick={() => setBillingCycle(c.key)} style={{
                  padding: "12px 8px", borderRadius: "var(--radius-md)", border: `1.5px solid ${billingCycle === c.key ? "var(--accent)" : "var(--border)"}`,
                  background: billingCycle === c.key ? "var(--accent-soft)" : "var(--bg-elevated)",
                  color: billingCycle === c.key ? "var(--accent)" : "var(--text-secondary)", cursor: "pointer", transition: "all 0.12s",
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{c.label}</div>
                  {c.discount && <div style={{ fontSize: 11, color: "var(--green)", marginTop: 2, fontWeight: 600 }}>Tiết kiệm {c.discount}</div>}
                </button>
              ))}
            </div>
          </div>

          <AddonPicker scope="hosting" selected={addonIds} onChange={(ids, m) => { setAddonIds(ids); setAddonMonthly(m); }} />

          {/* Domain */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>Tên miền</h3>
            <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" style={{ width: "100%", background: "var(--bg-elevated)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px", color: "var(--text-primary)", fontSize: 14, outline: "none", fontFamily: "var(--font-mono)" }}
              onFocus={e => e.target.style.borderColor = "rgba(79,124,255,0.5)"} onBlur={e => e.target.style.borderColor = "var(--border)"} />
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 6 }}>Tên miền sẽ được trỏ tới tài khoản cPanel của bạn</div>
          </div>
        </div>

        {/* Order summary */}
        <div style={{ position: "sticky", top: 24 }}>
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Tóm tắt đơn hàng</h3>

            {pkg ? (
              <>
                <div style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: "12px 14px", marginBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{pkg.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{pkg.storage}MB Disk · {pkg.databases === 0 ? "∞" : pkg.databases} DB</div>
                  {domain && <div style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{domain}</div>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} placeholder="Mã giảm giá" style={{ flex: 1, background: "var(--bg-elevated)", border: `1.5px solid ${couponResult?.valid ? "rgba(34,197,94,0.4)" : couponResult?.valid === false ? "rgba(239,68,68,0.4)" : "var(--border)"}`, borderRadius: "var(--radius-md)", padding: "8px 12px", color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: "var(--font-mono)" }} />
                    <button onClick={checkCoupon} disabled={couponLoading || !couponCode.trim()} style={{ padding: "8px 14px", background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--text-secondary)", fontSize: 12.5, cursor: "pointer", fontWeight: 600 }}>
                      {couponLoading ? "..." : "Áp dụng"}
                    </button>
                  </div>
                  {couponResult?.valid && <div style={{ fontSize: 12, color: "var(--green)", marginTop: 5 }}>&#10003; Giảm {formatCurrency(couponResult.data.discount)}</div>}
                  {couponResult?.valid === false && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 5 }}>&#10007; {couponResult.error}</div>}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "var(--text-muted)" }}>Giá gốc</span>
                    <span style={{ color: "var(--text-secondary)" }}>{formatCurrency(basePrice)}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                      <span style={{ color: "var(--text-muted)" }}>Giảm giá</span>
                      <span style={{ color: "var(--green)" }}>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>Tổng cộng</span>
                  <span style={{ fontWeight: 900, fontSize: 18, color: "var(--accent)", letterSpacing: "-0.02em" }}>{formatCurrency(finalPrice)}</span>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: 13 }}>Chọn gói hosting để xem giá</div>
            )}

            {error && <div style={{ background: "var(--red-soft)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)", padding: "9px 12px", color: "var(--red)", fontSize: 12.5, marginBottom: 12 }}>⚠ {error}</div>}

            <button onClick={order} disabled={ordering || !selectedPkg || !domain.trim()} style={{
              width: "100%", padding: "13px", border: "none", borderRadius: "var(--radius-md)",
              background: (ordering || !selectedPkg || !domain.trim()) ? "rgba(79,124,255,0.3)" : "var(--accent)",
              color: "white", fontSize: 14, fontWeight: 700,
              cursor: (ordering || !selectedPkg || !domain.trim()) ? "not-allowed" : "pointer",
            }}>
              {ordering ? "Đang xử lý..." : `Đặt mua — ${formatCurrency(finalPrice)}`}
            </button>
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 11.5, marginTop: 10 }}>Thanh toán từ ví · cPanel được tạo tự động</p>
          </div>
        </div>
      </div>
    </div>
  );
}
