"use client";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

export default function ActivityLogPage() {
  const { t } = useLocale();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/activity-log${filter?`?action=${filter}`:""}`).then(r=>r.json()).then(d=>{ setLogs(d.data?.logs||[]); setTotal(d.data?.total||0); setLoading(false); });
  }, [filter]);

  const actionColors: Record<string,string> = { "vps.order":"var(--cyan)", "hosting.order":"var(--purple)", "hosting.cpanel_sso":"var(--accent)", "vps.action":"var(--yellow)" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>Activity Log ({total})</h1>
        <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder={t("Lọc theo action...")} style={{ padding:"8px 12px", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-primary)", fontSize:13, outline:"none", width:200 }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
      </div>
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        {loading ? <div className="skeleton" style={{ height:300, margin:16, borderRadius:"var(--radius-md)" }}/> : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {[t("Thời gian"),t("Người dùng"),"Action","Resource","IP"].map(h=>(
                <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.05em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {logs.map(log=>(
                <tr key={log.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }} onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"} onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                  <td style={{ padding:"11px 16px", fontSize:11.5, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{formatDate(log.createdAt)}</td>
                  <td style={{ padding:"11px 16px" }}>
                    <div style={{ fontSize:12.5, fontWeight:600, color:"var(--text-primary)" }}>{log.user?.name||"System"}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>{log.user?.email}</div>
                  </td>
                  <td style={{ padding:"11px 16px" }}>
                    <span style={{ padding:"2px 8px", borderRadius:6, fontSize:12, fontWeight:600, background:`${actionColors[log.action]||"var(--text-muted)"}18`, color:actionColors[log.action]||"var(--text-secondary)", fontFamily:"var(--font-mono)" }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding:"11px 16px", fontSize:12, color:"var(--text-muted)" }}>{log.resource}{log.resourceId?` #${log.resourceId.slice(0,8)}`:""}</td>
                  <td style={{ padding:"11px 16px", fontSize:12, color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{log.ipAddress||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
