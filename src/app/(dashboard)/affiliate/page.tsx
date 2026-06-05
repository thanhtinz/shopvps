"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p,i)=><path key={i} d={i===0?p:"M"+p}/>)}</svg>;
}

export default function AffiliatePage() {
  const { t } = useLocale();
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/affiliate").then(r=>r.json()).then(d=>{ setData(d.data); setLoading(false); });
  }, []);

  function copy() {
    const url = `${window.location.origin}/register?ref=${data?.affiliateCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true); setTimeout(()=>setCopied(false), 2000);
  }

  if (loading) return <div style={{ maxWidth:800, margin:"0 auto" }}><div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/></div>;

  const refUrl = typeof window !== "undefined" ? `${window.location.origin}/register?ref=${data?.affiliateCode}` : "";

  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:4 }}>{t("Chương trình Affiliate")}</h1>
      <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:24 }}>{t("Giới thiệu bạn bè và nhận hoa hồng cho mỗi đơn hàng")}</p>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:24 }}>
        {[
          { label:t("Số dư hoa hồng"), value:formatCurrency(data?.balance||0), color:"var(--green)", icon:"" },
          { label:t("Người được giới thiệu"), value:String(data?.referrals?.length||0), color:"var(--accent)", icon:"" },
          { label:t("Đã nhận"), value:formatCurrency(data?.totalEarned||0), color:"var(--purple)", icon:"" },
          { label:t("Chờ duyệt"), value:formatCurrency(data?.totalPending||0), color:"var(--yellow)", icon:"" },
        ].map(s => (
          <div key={s.label} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
              <span style={{ fontSize:12.5, color:"var(--text-secondary)" }}>{s.label}</span>
              <span style={{ fontSize:18 }}>{s.icon}</span>
            </div>
            <div style={{ fontSize:24, fontWeight:900, color:s.color, letterSpacing:"-0.03em" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Ref link */}
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px", marginBottom:18 }}>
        <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>{t("Link giới thiệu của bạn")}</div>
        <div style={{ fontSize:12.5, color:"var(--text-muted)", marginBottom:14 }}>{t("Mỗi người đăng ký qua link này, bạn nhận hoa hồng % theo đơn hàng của họ")}</div>
        <div style={{ display:"flex", gap:10 }}>
          <div style={{ flex:1, background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 14px", fontSize:13, color:"var(--text-secondary)", fontFamily:"var(--font-mono)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {refUrl}
          </div>
          <button onClick={copy} style={{ padding:"10px 16px", background:copied?"var(--green-soft)":"var(--accent)", border:`1px solid ${copied?"rgba(34,197,94,0.3)":"transparent"}`, borderRadius:"var(--radius-md)", color:copied?"var(--green)":"white", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.2s", whiteSpace:"nowrap" }}>
            {copied?t("✓ Đã copy"):t("Copy link")}
          </button>
        </div>
        <div style={{ marginTop:12, padding:"10px 12px", background:"var(--accent-soft)", borderRadius:"var(--radius-md)", fontSize:12, color:"var(--text-secondary)" }}>
          {t("Mã affiliate:")} <strong style={{ color:"var(--accent)", fontFamily:"var(--font-mono)" }}>{data?.affiliateCode}</strong>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
        {/* Referrals */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>
            {t("Người được giới thiệu")} ({data?.referrals?.length||0})
          </div>
          <div style={{ maxHeight:320, overflowY:"auto" }}>
            {!data?.referrals?.length ? (
              <div style={{ textAlign:"center", padding:"40px 16px", color:"var(--text-muted)", fontSize:13 }}>{t("Chưa có ai đăng ký qua link của bạn")}</div>
            ) : data.referrals.map((r: any) => (
              <div key={r.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 18px", borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
              >
                <div style={{ width:30, height:30, borderRadius:"50%", background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"var(--accent)", flexShrink:0 }}>
                  {r.referred?.name?.[0]||"?"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{r.referred?.name||"—"}</div>
                  <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{r.referred?.email}</div>
                </div>
                <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{formatDate(r.createdAt)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Commissions */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", fontSize:13, fontWeight:700, color:"var(--text-primary)" }}>
            {t("Lịch sử hoa hồng")}
          </div>
          <div style={{ maxHeight:320, overflowY:"auto" }}>
            {!data?.commissions?.length ? (
              <div style={{ textAlign:"center", padding:"40px 16px", color:"var(--text-muted)", fontSize:13 }}>{t("Chưa có hoa hồng nào")}</div>
            ) : data.commissions.map((c: any) => (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"11px 18px", borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
              >
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:"var(--text-primary)" }}>{c.orderType || t("Đơn hàng")}</div>
                  <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{formatDate(c.createdAt)}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"var(--green)" }}>+{formatCurrency(c.amount)}</div>
                  <Badge color={c.status==="PAID"?"green":c.status==="APPROVED"?"blue":c.status==="CANCELLED"?"red":"yellow"}>
                    {c.status==="PAID"?t("Đã thanh toán"):c.status==="APPROVED"?t("Đã duyệt"):c.status==="CANCELLED"?t("Đã huỷ"):t("Chờ duyệt")}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
