"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {d.split(" M").map((p, i) => <path key={i} d={i === 0 ? p : "M" + p} />)}
    </svg>
  );
}

const AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];

export default function WalletPage() {
  const { t: tr } = useLocale();
  const [balance, setBalance] = useState<any>(null);
  const [depositInfo, setDepositInfo] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [amount, setAmount] = useState(200000);
  const [customAmount, setCustomAmount] = useState("");
  const [activeTab, setActiveTab] = useState<"deposit" | "history">("deposit");
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [curCode, setCurCode] = useState("VND");
  const [gateway, setGateway] = useState("");
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [giftMsg, setGiftMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/wallet/balance").then(r => r.json()),
      fetch("/api/wallet/transactions").then(r => r.json()),
      fetch("/api/payments/gateways").then(r => r.json()),
    ]).then(([b, t, g]) => {
      setBalance(b.data);
      setTransactions(t.data?.items || []);
      const gw = g.data?.gateways || [];
      setGateways(gw);
      setCurrencies(g.data?.currencies || []);
      setCurCode(g.data?.preferred || g.data?.base || "VND");
      if (gw[0]) setGateway(gw[0].code);
      setLoading(false);
    });
    const p = new URLSearchParams(window.location.search).get("deposit");
    if (p === "success") setNotice(tr("Thanh toán thành công! Số dư sẽ được cập nhật trong giây lát."));
    else if (p === "cancel") setNotice(tr("Giao dịch đã bị huỷ."));
  }, []);

  useEffect(() => {
    const amt = customAmount ? parseInt(customAmount) : amount;
    if (amt >= 10000) {
      fetch(`/api/wallet/deposit-info?amount=${amt}`).then(r => r.json()).then(d => setDepositInfo(d.data));
    }
  }, [amount, customAmount]);

  const finalAmount = customAmount ? parseInt(customAmount) || 0 : amount;
  const cur = currencies.find((c: any) => c.code === curCode);
  const isBase = !cur || Number(cur.rate) === 1;
  const amountBase = isBase ? finalAmount : Math.round(finalAmount * Number(cur.rate));
  const bonus = depositInfo?.bonuses?.find((b: any) => amountBase >= Number(b.minAmount) && (!b.maxAmount || amountBase <= Number(b.maxAmount)));

  async function startDeposit() {
    if (!gateway || finalAmount <= 0) return;
    setSubmitting(true); setResult(null);
    const res = await fetch("/api/wallet/deposit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: finalAmount, currencyCode: curCode, gatewayCode: gateway }) });
    const d = await res.json();
    setSubmitting(false);
    if (!res.ok) { alert(d.error || tr("Không khởi tạo được thanh toán")); return; }
    if (d.data?.kind === "redirect") { window.location.href = d.data.url; return; }
    setResult(d.data);
  }

  async function redeemCode(e: React.FormEvent) {
    e.preventDefault(); if (!giftCode.trim() || redeeming) return;
    setRedeeming(true); setGiftMsg(null);
    const res = await fetch("/api/wallet/redeem", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: giftCode.trim() }) });
    const d = await res.json();
    setRedeeming(false);
    if (res.ok) {
      setGiftMsg({ ok: true, text: d.message || tr("Đổi mã thành công!") });
      setGiftCode("");
      fetch("/api/wallet/balance").then(r => r.json()).then(b => setBalance(b.data));
    } else setGiftMsg({ ok: false, text: d.error || tr("Mã không hợp lệ") });
  }

  const txTypeLabel: Record<string, string> = { DEPOSIT: tr("Nạp tiền"), PURCHASE: tr("Thanh toán"), REFUND: tr("Hoàn tiền"), BONUS: tr("Thưởng"), COMMISSION: tr("Hoa hồng"), WITHDRAWAL: tr("Rút") };
  const txColor: Record<string, "green"|"red"|"yellow"|"blue"> = { DEPOSIT: "green", PURCHASE: "yellow", REFUND: "blue", BONUS: "green", COMMISSION: "blue", WITHDRAWAL: "red" };

  if (loading) return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="skeleton" style={{ height: 120, borderRadius: "var(--radius-lg)", marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 400, borderRadius: "var(--radius-lg)" }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 20 }}>{tr("Ví & Thanh toán")}</h1>

      {/* Balance cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
        <div style={{ background: "linear-gradient(135deg,rgba(79,124,255,0.15),rgba(124,58,237,0.08))", border: "1px solid rgba(79,124,255,0.25)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{tr("Số dư ví chính")}</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>{formatCurrency(balance?.balance || 0)}</div>
        </div>
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "24px" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{tr("Ví hoa hồng")}</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em" }}>{formatCurrency(balance?.affiliateBalance || 0)}</div>
        </div>
      </div>

      {/* Redeem gift code */}
      <form onSubmit={redeemCode} style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center" }}>
        <input value={giftCode} onChange={e => setGiftCode(e.target.value.toUpperCase())} placeholder={tr("Nhập mã quà tặng / credit...")} style={{ flex: 1, background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", padding: "10px 14px", color: "var(--text-primary)", fontSize: 13, outline: "none", fontFamily: "var(--font-mono)" }} />
        <button type="submit" disabled={redeeming || !giftCode.trim()} style={{ padding: "10px 18px", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", color: "var(--accent)", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{redeeming ? "..." : tr("Đổi mã")}</button>
      </form>
      {giftMsg && <div style={{ marginTop: -10, marginBottom: 16, fontSize: 12.5, color: giftMsg.ok ? "var(--green)" : "var(--red)" }}>{giftMsg.text}</div>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", padding: 4, width: "fit-content", marginBottom: 20 }}>
        {(["deposit", "history"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "7px 18px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            background: activeTab === tab ? "var(--bg-surface)" : "transparent",
            color: activeTab === tab ? "var(--text-primary)" : "var(--text-muted)",
            boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.3)" : "none",
          }}>
            {tab === "deposit" ? tr("Nạp tiền") : tr("Lịch sử")}
          </button>
        ))}
      </div>

      {/* Deposit tab */}
      {activeTab === "deposit" && (
       <div>
        {notice && (
          <div style={{ marginBottom: 16, padding: "12px 16px", background: "var(--accent-soft)", border: "1px solid rgba(79,124,255,0.3)", borderRadius: "var(--radius-md)", fontSize: 13, color: "var(--text-primary)" }}>{notice}</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          {/* Left: amount selector */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 16 }}>{tr("Chọn số tiền nạp")}</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => { setAmount(a); setCustomAmount(""); }} style={{
                  padding: "9px 4px", borderRadius: "var(--radius-md)",
                  border: amount === a && !customAmount ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                  background: amount === a && !customAmount ? "var(--accent-soft)" : "var(--bg-elevated)",
                  color: amount === a && !customAmount ? "var(--accent)" : "var(--text-secondary)",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.12s",
                }}>
                  {(a / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
            <input
              type="number" placeholder={tr("Hoặc nhập số tiền khác...")}
              value={customAmount}
              onChange={e => setCustomAmount(e.target.value)}
              style={{
                width: "100%", padding: "10px 12px",
                background: "var(--bg-elevated)", border: "1.5px solid " + (customAmount ? "var(--accent)" : "var(--border)"),
                borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: 13, outline: "none",
              }}
            />

            {/* Bonus info */}
            {depositInfo?.bonuses?.length > 0 && (
              <div style={{ marginTop: 14, padding: "12px", background: "var(--green-soft)", borderRadius: "var(--radius-md)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--green)", marginBottom: 6 }}> {tr("Khuyến mãi nạp tiền")}</div>
                {depositInfo.bonuses.map((b: any, i: number) => (
                  <div key={i} style={{ fontSize: 11.5, color: "var(--text-secondary)", marginBottom: 2 }}>
                    {tr("Nạp từ")} {formatCurrency(b.minAmount)} → {tr("Bonus")} <strong style={{ color: "var(--green)" }}>+{b.bonusPercent}%</strong>
                  </div>
                ))}
              </div>
            )}

            {bonus && finalAmount > 0 && (
              <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--accent-soft)", borderRadius: "var(--radius-md)", fontSize: 12.5, display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
                <span>{tr("Bạn nhận thêm")} <strong style={{ color: "var(--accent)" }}>{formatCurrency(Math.floor(finalAmount * Number(bonus.bonusPercent) / 100))}</strong> {tr("bonus!")}</span>
              </div>
            )}
          </div>

          {/* Right: currency + gateway */}
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
            <h3 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 16 }}>{tr("Phương thức thanh toán")}</h3>

            {currencies.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>{tr("Tiền tệ")}</label>
                <select value={curCode} onChange={e => { const v = e.target.value; setCurCode(v); setResult(null); fetch("/api/currencies", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: v }) }).catch(() => {}); }} style={{ width: "100%", background: "var(--bg-elevated)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-md)", padding: "9px 11px", color: "var(--text-primary)", fontSize: 13, outline: "none" }}>
                  {currencies.map((c: any) => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                </select>
                {!isBase && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 5 }}>≈ {formatCurrency(amountBase)} ({tr("tỷ giá")} {Number(cur.rate).toLocaleString("vi-VN")})</div>}
              </div>
            )}

            {gateways.length === 0 ? (
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", padding: "16px 0" }}>{tr("Chưa có cổng thanh toán nào được bật.")}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {gateways.map((g: any) => (
                  <label key={g.code} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", border: `1.5px solid ${gateway === g.code ? "var(--accent)" : "var(--border)"}`, borderRadius: "var(--radius-md)", cursor: "pointer", background: gateway === g.code ? "var(--accent-soft)" : "transparent" }}>
                    <input type="radio" checked={gateway === g.code} onChange={() => setGateway(g.code)} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{g.name}</span>
                  </label>
                ))}
              </div>
            )}

            <button onClick={startDeposit} disabled={submitting || !gateway || finalAmount <= 0} style={{ width: "100%", padding: "12px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontWeight: 700, fontSize: 14, cursor: gateway && finalAmount > 0 ? "pointer" : "not-allowed", opacity: gateway && finalAmount > 0 ? 1 : 0.5 }}>
              {submitting ? tr("Đang xử lý...") : `${tr("Nạp")} ${cur ? Number(finalAmount).toLocaleString("en-US") + " " + (cur.symbol || cur.code) : formatCurrency(finalAmount)}`}
            </button>

            {result?.kind === "instructions" && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>{result.title}</div>
                {result.qrUrl && <div style={{ textAlign: "center", marginBottom: 12 }}><img src={result.qrUrl} alt="QR" style={{ width: 170, height: 170, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }} /></div>}
                {result.lines?.map((row: any) => (
                  <div key={row.label} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
                    <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 600, fontFamily: "var(--font-mono)", textAlign: "right", wordBreak: "break-all" }}>{row.value}</span>
                  </div>
                ))}
                {result.note && <div style={{ marginTop: 12, padding: "10px 12px", background: "var(--yellow-soft)", borderRadius: "var(--radius-md)", fontSize: 12, color: "var(--yellow)" }}>{result.note}</div>}
              </div>
            )}
          </div>
        </div>
       </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {[tr("Thời gian"), tr("Loại"), tr("Mô tả"), tr("Số tiền"), tr("Số dư sau")].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: 13 }}>{tr("Chưa có giao dịch")}</td></tr>
                ) : transactions.map(tx => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--bg-hover)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(tx.createdAt)}</td>
                    <td style={{ padding: "12px 16px" }}><Badge color={txColor[tx.type] || "gray"}>{txTypeLabel[tx.type] || tx.type}</Badge></td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-secondary)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.description || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: ["DEPOSIT","BONUS","COMMISSION","REFUND"].includes(tx.type) ? "var(--green)" : "var(--red)", whiteSpace: "nowrap" }}>
                      {["DEPOSIT","BONUS","COMMISSION","REFUND"].includes(tx.type) ? "+" : "-"}{formatCurrency(Math.abs(Number(tx.amount)))}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatCurrency(tx.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
