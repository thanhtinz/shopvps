"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

export default function InvoicesPage() {
  const { t } = useLocale();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState("");

  function load() {
    fetch("/api/invoices").then(r=>r.json()).then(d=>{ setInvoices(d.data?.items||[]); setTotal(d.data?.total||0); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function payInvoice(id: string) {
    setPayError(""); setPayingId(id);
    try {
      const res = await fetch(`/api/invoices/${id}/pay`, { method: "POST" });
      const data = await res.json();
      if (data.success) load();
      else setPayError(data.error || t("Không thể thanh toán hoá đơn"));
    } finally { setPayingId(null); }
  }

  const statusColor: Record<string,"green"|"red"|"yellow"|"gray"> = { PAID:"green", UNPAID:"red", CANCELLED:"gray", REFUNDED:"yellow" };
  const statusLabel: Record<string,string> = { PAID:t("Đã thanh toán"), UNPAID:t("Chưa thanh toán"), CANCELLED:t("Đã huỷ"), REFUNDED:t("Đã hoàn") };

  if (loading) return <div style={{ maxWidth:900, margin:"0 auto" }}><div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/></div>;

  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:20 }}>{t("Hoá đơn")} ({total})</h1>

      {payError && <div style={{ background:"var(--red-soft)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius-md)", padding:"10px 14px", color:"var(--red)", fontSize:13, marginBottom:16 }}>{payError}</div>}

      {invoices.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 20px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)" }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div>
          <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>{t("Chưa có hoá đơn nào")}</h3>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>{t("Hoá đơn sẽ được tạo tự động khi bạn mua dịch vụ")}</p>
        </div>
      ) : (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {[t("Số HĐ"),t("Ngày"),t("Dịch vụ"),t("Tổng tiền"),t("Trạng thái"),""].map(h=>(
                  <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv=>(
                <tr key={inv.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:12.5, color:"var(--accent)", fontWeight:600 }}>{inv.invoiceNumber}</span>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{formatDate(inv.createdAt)}</td>
                  <td style={{ padding:"12px 16px" }}>
                    {inv.items?.map((item: any) => (
                      <div key={item.id} style={{ fontSize:12.5, color:"var(--text-secondary)" }}>{item.description}</div>
                    ))}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:14, fontWeight:800, color:"var(--text-primary)" }}>{formatCurrency(inv.total)}</td>
                  <td style={{ padding:"12px 16px" }}><Badge color={statusColor[inv.status]||"gray"}>{statusLabel[inv.status]||inv.status}</Badge></td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                      {inv.status === "UNPAID" && (
                        <button onClick={()=>payInvoice(inv.id)} disabled={payingId===inv.id} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"none", background:"var(--accent)", color:"white", fontSize:12, fontWeight:600, cursor:payingId===inv.id?"not-allowed":"pointer", opacity:payingId===inv.id?0.6:1 }}>
                          {payingId===inv.id ? t("Đang thanh toán...") : t("Thanh toán")}
                        </button>
                      )}
                      <button onClick={()=>window.open(`/api/invoices/pdf?id=${inv.id}`, "_blank")} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-secondary)", fontSize:12, cursor:"pointer" }}
                        onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--accent)";(e.currentTarget as HTMLElement).style.color="var(--accent)";}}
                        onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--border)";(e.currentTarget as HTMLElement).style.color="var(--text-secondary)";}}
                      >
                        {t("Xuất PDF")}
                      </button>
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
