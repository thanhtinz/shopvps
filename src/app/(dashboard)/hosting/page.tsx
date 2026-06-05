"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p,i)=><path key={i} d={i===0?p:"M"+p}/>)}</svg>;
}

const statusColor: Record<string,"green"|"yellow"|"red"|"blue"> = { ACTIVE:"green", PENDING:"yellow", SUSPENDED:"red", TERMINATED:"red" };
const statusLabel: Record<string,string> = { ACTIVE:"Đang hoạt động", PENDING:"Đang tạo", SUSPENDED:"Tạm dừng", TERMINATED:"Đã xoá" };

export default function HostingPage() {
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
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>{orders.length} gói hosting</p>
        </div>
        <button style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <Icon d="M12 5v14 M5 12h14"/> Mua Hosting mới
        </button>
      </div>

      {orders.length === 0 && (
        <div style={{ textAlign:"center", padding:"80px 20px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)" }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg></div>
          <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>Chưa có Hosting nào</h3>
          <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:24 }}>Mua gói hosting đầu tiên để triển khai website</p>
          <button style={{ padding:"10px 24px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer" }}>Mua Hosting ngay</button>
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
                    <Badge color={statusColor[h.status]||"gray"}>{statusLabel[h.status]||h.status}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>cPanel: {h.cpanelUsername || "Đang cấp"}</div>
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
                <div style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", marginBottom:2 }}>{formatCurrency(h.price)}/tháng</div>
                <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>HH: {h.expiresAt ? formatDate(h.expiresAt) : "—"}</div>
              </div>
            </div>

            {h.status === "ACTIVE" && (
              <div style={{ display:"flex", gap:8, marginTop:16, paddingTop:16, borderTop:"1px solid var(--border)", flexWrap:"wrap" }}>
                {[
                  { label:"Đăng nhập cPanel", icon:"M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71", color:"var(--accent)" },
                  { label:"Đổi mật khẩu", icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10", color:"var(--yellow)" },
                  { label:"Đổi domain", icon:"M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 019-9", color:"var(--cyan)" },
                  { label:"Gia hạn", icon:"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", color:"var(--green)" },
                ].map(btn => (
                  <button key={btn.label} style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", fontSize:12.5, cursor:"pointer", transition:"all 0.12s" }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor=btn.color; (e.currentTarget as HTMLElement).style.color=btn.color; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor="var(--border)"; (e.currentTarget as HTMLElement).style.color="var(--text-secondary)"; }}
                  >
                    <Icon d={btn.icon} size={13}/>{btn.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
