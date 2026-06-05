"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p,i)=><path key={i} d={i===0?p:"M"+p}/>)}</svg>;
}

const statusColor: Record<string,"green"|"yellow"|"red"|"blue"> = { ACTIVE:"green", PENDING:"yellow", SUSPENDED:"red", TERMINATED:"red" };
const statusLabel: Record<string,string> = { ACTIVE:"Đang hoạt động", PENDING:"Đang tạo", SUSPENDED:"Tạm dừng", TERMINATED:"Đã xoá" };

export default function HostingPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hosting/list").then(r=>r.json()).then(d=>{ setOrders(d.data||[]); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ maxWidth:1000, margin:"0 auto" }}>
      {[...Array(3)].map((_,i) => <div key={i} className="skeleton" style={{ height:120, borderRadius:"var(--radius-lg)", marginBottom:12 }}/>)}
    </div>
  );

  return (
    <div style={{ maxWidth:1000, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:2 }}>Hosting</h1>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>{orders.length} {t("gói hosting")}</p>
        </div>
        <button onClick={()=>router.push("/hosting/new")} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <Icon d="M12 5v14 M5 12h14"/> {t("Mua Hosting mới")}
        </button>
      </div>

      {orders.length === 0 && (
        <div style={{ textAlign:"center", padding:"80px 20px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)" }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg></div>
          <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>{t("Chưa có Hosting nào")}</h3>
          <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:24 }}>{t("Mua gói hosting đầu tiên để triển khai website")}</p>
          <button onClick={()=>router.push("/hosting/new")} style={{ padding:"10px 24px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer" }}>{t("Mua Hosting ngay")}</button>
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {orders.map(h => (
          <div key={h.id} className="animate-in" style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px", transition:"border-color 0.15s" }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.borderColor="var(--border-hover)"}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.borderColor="var(--border)"}
          >
            <div style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, flex:"1 1 280px" }}>
                <div style={{ width:44, height:44, borderRadius:"var(--radius-md)", background:h.status==="ACTIVE"?"var(--purple-soft)":"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", color:h.status==="ACTIVE"?"var(--purple)":"var(--text-muted)", flexShrink:0 }}>
                  <Icon d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" size={18}/>
                </div>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                    <span style={{ fontSize:14.5, fontWeight:700, color:"var(--text-primary)" }}>{h.domain}</span>
                    <Badge color={statusColor[h.status]||"gray"}>{statusLabel[h.status]?t(statusLabel[h.status]):h.status}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>cPanel: {h.cpanelUsername || t("Đang cấp")}</div>
                </div>
              </div>
              <div style={{ display:"flex", gap:20, flex:"1 1 200px" }}>
                {[
                  { label:"Disk", val:`${h.package?.storage||"-"} MB` },
                  { label:"BW", val:h.package?.bandwidth===0?"Unlimited":`${h.package?.bandwidth||"-"} MB` },
                  { label:"DB", val:h.package?.databases===0?"∞":String(h.package?.databases||"-") },
                  { label:"Email", val:h.package?.emailAccounts===0?"∞":String(h.package?.emailAccounts||"-") },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize:10, color:"var(--text-muted)", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:2 }}>{s.label}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-secondary)" }}>{s.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ flex:"0 0 auto", textAlign:"right" }}>
                <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", marginBottom:2 }}>{formatCurrency(h.price)}{t("/tháng")}</div>
                <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>HH: {h.expiresAt ? formatDate(h.expiresAt) : "—"}</div>
              </div>
            </div>

            <div style={{ display:"flex", gap:8, marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)", flexWrap:"wrap" }}>
              <Link href={`/hosting/${h.id}`} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:12.5, fontWeight:600, textDecoration:"none" }}>
                <Icon d="M12 20h9 M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" size={13}/> {t("Quản lý")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
