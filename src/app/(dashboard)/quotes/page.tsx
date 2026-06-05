"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

export default function QuotesPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  function load() {
    fetch("/api/quotes").then(r=>r.json()).then(d=>{ setQuotes(d.data||[]); setLoading(false); });
  }
  useEffect(() => { load(); }, []);

  async function acceptQuote(id: string) {
    setActionError(""); setBusyId(id);
    try {
      const res = await fetch(`/api/quotes/${id}/accept`, { method: "POST" });
      const data = await res.json();
      if (data.success) router.push("/invoices");
      else setActionError(data.error || t("Không thể xử lý báo giá"));
    } finally { setBusyId(null); }
  }

  async function declineQuote(id: string) {
    setActionError(""); setBusyId(id);
    try {
      const res = await fetch(`/api/quotes/${id}/decline`, { method: "POST" });
      const data = await res.json();
      if (data.success) load();
      else setActionError(data.error || t("Không thể xử lý báo giá"));
    } finally { setBusyId(null); }
  }

  const statusColor: Record<string,"green"|"red"|"yellow"|"gray"> = { ACCEPTED:"green", SENT:"yellow", DECLINED:"red", EXPIRED:"gray" };
  const statusLabel: Record<string,string> = { SENT:t("Chờ phản hồi"), ACCEPTED:t("Đã chấp nhận"), DECLINED:t("Đã từ chối"), EXPIRED:t("Hết hạn") };

  if (loading) return <div style={{ maxWidth:900, margin:"0 auto" }}><div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/></div>;

  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:20 }}>{t("Báo giá")} ({quotes.length})</h1>

      {actionError && <div style={{ background:"var(--red-soft)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius-md)", padding:"10px 14px", color:"var(--red)", fontSize:13, marginBottom:16 }}>{actionError}</div>}

      {quotes.length === 0 ? (
        <div style={{ textAlign:"center", padding:"80px 20px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)" }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg></div>
          <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>{t("Chưa có báo giá nào")}</h3>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>{t("Báo giá từ đội ngũ sẽ xuất hiện ở đây")}</p>
        </div>
      ) : (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {[t("Số BG"),t("Ngày"),t("Hạng mục"),t("Tổng tiền"),t("Trạng thái"),""].map(h=>(
                  <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map(q=>(
                <tr key={q.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:12.5, color:"var(--accent)", fontWeight:600 }}>{q.quoteNumber}</span>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{formatDate(q.createdAt)}</td>
                  <td style={{ padding:"12px 16px" }}>
                    {q.items?.map((item: any) => (
                      <div key={item.id} style={{ fontSize:12.5, color:"var(--text-secondary)" }}>{item.description}</div>
                    ))}
                    {q.validUntil && <div style={{ fontSize:11.5, color:"var(--text-muted)", marginTop:2 }}>{t("Hạn:")} {formatDate(q.validUntil)}</div>}
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:14, fontWeight:800, color:"var(--text-primary)" }}>{formatCurrency(q.total)}</td>
                  <td style={{ padding:"12px 16px" }}><Badge color={statusColor[q.status]||"gray"}>{statusLabel[q.status]||q.status}</Badge></td>
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                      {q.status === "SENT" && (
                        <>
                          <button onClick={()=>acceptQuote(q.id)} disabled={busyId===q.id} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"none", background:"var(--accent)", color:"white", fontSize:12, fontWeight:600, cursor:busyId===q.id?"not-allowed":"pointer", opacity:busyId===q.id?0.6:1 }}>
                            {busyId===q.id ? t("Đang xử lý...") : t("Chấp nhận")}
                          </button>
                          <button onClick={()=>declineQuote(q.id)} disabled={busyId===q.id} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-secondary)", fontSize:12, cursor:busyId===q.id?"not-allowed":"pointer", opacity:busyId===q.id?0.6:1 }}
                            onMouseEnter={e=>{ if(busyId!==q.id){(e.currentTarget as HTMLElement).style.borderColor="var(--accent)";(e.currentTarget as HTMLElement).style.color="var(--accent)";} }}
                            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor="var(--border)";(e.currentTarget as HTMLElement).style.color="var(--text-secondary)";}}
                          >
                            {busyId===q.id ? t("Đang xử lý...") : t("Từ chối")}
                          </button>
                        </>
                      )}
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
