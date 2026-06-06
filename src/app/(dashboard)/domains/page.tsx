"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import DnsManager from "@/components/DnsManager";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

const statusColor: Record<string, "green"|"yellow"|"red"|"gray"|"blue"> = { ACTIVE: "green", PENDING: "yellow", EXPIRED: "red", CANCELLED: "gray", TRANSFERRED: "blue" };
const statusLabel: Record<string, string> = { ACTIVE: "Đang hoạt động", PENDING: "Chờ xử lý", EXPIRED: "Hết hạn", CANCELLED: "Đã huỷ", TRANSFERRED: "Đã chuyển" };

export default function DomainsPage() {
  const { t: tr } = useLocale();
  const [domains, setDomains] = useState<any[]>([]);
  const [tlds, setTlds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [years, setYears] = useState(1);
  const [busy, setBusy] = useState(false);
  const [manage, setManage] = useState<any>(null);
  const [ns, setNs] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => Promise.all([
    fetch("/api/domains").then(r=>r.json()),
    fetch("/api/domains/tlds").then(r=>r.json()),
  ]).then(([d, t]) => { setDomains(d.data||[]); setTlds(t.data||[]); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function check(e: React.FormEvent) {
    e.preventDefault();
    const domain = query.toLowerCase().trim();
    if (!domain) return;
    setChecking(true); setResult(null); setMsg("");
    const res = await fetch(`/api/domains/check?domain=${encodeURIComponent(domain)}`);
    const d = await res.json();
    setChecking(false);
    if (!res.ok) { setMsg(d.error || tr("Lỗi")); return; }
    setResult(d.data);
  }

  async function register(type: "register"|"transfer") {
    if (!result) return;
    setBusy(true);
    const res = await fetch("/api/domains/order", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ domain: result.domain, years, type }) });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) { alert(d.error || tr("Lỗi")); return; }
    setResult(null); setQuery(""); setMsg(tr("Đã tạo đơn tên miền, đang chờ xử lý.")); load();
  }

  function openManage(dm: any) { setManage(dm); setNs(dm.nameservers || ""); }
  async function saveManage(extra?: any) {
    const res = await fetch(`/api/domains/${manage.id}`, { method:"PATCH", headers:{"Content-Type":"application/json"}, body: JSON.stringify(extra || { nameservers: ns }) });
    const d = await res.json();
    if (!res.ok) { alert(d.error || tr("Lỗi")); return; }
    setManage(null); load();
  }

  const inp = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" };

  return (
    <div style={{ maxWidth:1000, margin:"0 auto" }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:4 }}>{tr("Tên miền")}</h1>
      <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:20 }}>{tr("Đăng ký, chuyển về và quản lý tên miền")}</p>

      {msg && <div style={{ marginBottom:16, padding:"11px 14px", background:"var(--green-soft)", border:"1px solid rgba(34,197,94,0.25)", borderRadius:"var(--radius-md)", fontSize:13, color:"var(--green)" }}>{msg}</div>}

      {/* Search / register */}
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px", marginBottom:24 }}>
        <form onSubmit={check} style={{ display:"flex", gap:10 }}>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={tr("vd: tencuaban.com")} style={inp as any}/>
          <button type="submit" disabled={checking} style={{ padding:"10px 20px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13.5, cursor:"pointer", whiteSpace:"nowrap" }}>{checking?tr("Đang kiểm tra..."):tr("Kiểm tra")}</button>
        </form>

        {tlds.length>0 && (
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:14 }}>
            {tlds.map(t=>(
              <span key={t.id} style={{ fontSize:11.5, color:"var(--text-secondary)", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:99, padding:"4px 10px" }}>
                {t.tld} · {formatCurrency(Number(t.registerPrice))}
              </span>
            ))}
          </div>
        )}

        {result && (
          <div style={{ marginTop:16, padding:"16px", borderRadius:"var(--radius-md)", border:"1px solid var(--border)", background:"var(--bg-elevated)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>{result.domain}</div>
                <div style={{ fontSize:12.5, marginTop:3 }}>
                  {result.available === true && <span style={{ color:"var(--green)" }}>● {tr("Còn trống")} — {formatCurrency(result.registerPrice)}{tr("/năm")}</span>}
                  {result.available === false && <span style={{ color:"var(--red)" }}>● {tr("Đã được đăng ký")} {result.transferPrice ? `— ${tr("có thể transfer")} ${formatCurrency(result.transferPrice)}` : ""}</span>}
                  {result.unknown && <span style={{ color:"var(--yellow)" }}>● {tr("Không kiểm tra được tự động — bạn vẫn có thể đặt đơn")}</span>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <select value={years} onChange={e=>setYears(parseInt(e.target.value))} style={{ ...inp as any, width:90 }}>
                  {[1,2,3,5,10].map(y=><option key={y} value={y}>{y} {tr("năm")}</option>)}
                </select>
                {result.available !== false ? (
                  <button onClick={()=>register("register")} disabled={busy} style={{ padding:"10px 18px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13, cursor:"pointer" }}>{busy?"...":tr("Đăng ký")}</button>
                ) : result.transferPrice ? (
                  <button onClick={()=>register("transfer")} disabled={busy} style={{ padding:"10px 18px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13, cursor:"pointer" }}>{busy?"...":"Transfer"}</button>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* My domains */}
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <div style={{ padding:"14px 18px", borderBottom:"1px solid var(--border)", fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{tr("Tên miền của tôi")} ({domains.length})</div>
        {loading ? <div className="skeleton" style={{ height:160, margin:16, borderRadius:"var(--radius-md)" }}/> : domains.length===0 ? (
          <div style={{ textAlign:"center", padding:"50px 20px", color:"var(--text-muted)", fontSize:13 }}>{tr("Bạn chưa có tên miền nào")}</div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Tên miền","Trạng thái","Hết hạn","Tự gia hạn",""].map(h=>(
                <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.05em" }}>{h?tr(h):h}</th>
              ))}
            </tr></thead>
            <tbody>
              {domains.map(d=>(
                <tr key={d.id} style={{ borderBottom:"1px solid var(--border)" }}>
                  <td style={{ padding:"12px 16px", fontSize:13.5, fontWeight:600, color:"var(--text-primary)" }}>{d.domain}</td>
                  <td style={{ padding:"12px 16px" }}><Badge color={statusColor[d.status]||"gray"}>{statusLabel[d.status]?tr(statusLabel[d.status]):d.status}</Badge></td>
                  <td style={{ padding:"12px 16px", fontSize:12.5, color:"var(--text-muted)" }}>{d.expiresAt?formatDate(d.expiresAt):"—"}</td>
                  <td style={{ padding:"12px 16px", fontSize:12.5, color:"var(--text-secondary)" }}>{d.autoRenew?tr("Bật"):tr("Tắt")}</td>
                  <td style={{ padding:"12px 16px", textAlign:"right" }}>
                    <button onClick={()=>openManage(d)} style={{ padding:"6px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-secondary)", fontSize:12.5, cursor:"pointer" }}>{tr("Quản lý")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {manage && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setManage(null)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"26px", width:580, maxWidth:"94vw", maxHeight:"90vh", overflowY:"auto" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:4 }}>{manage.domain}</h3>
            <div style={{ fontSize:12.5, color:"var(--text-muted)", marginBottom:18 }}>{statusLabel[manage.status]?tr(statusLabel[manage.status]):manage.status} · {tr("Hết hạn")} {manage.expiresAt?formatDate(manage.expiresAt):"—"}</div>

            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:6 }}>{tr("Nameservers (mỗi dòng/phẩy)")}</label>
            <textarea value={ns} onChange={e=>setNs(e.target.value)} rows={3} placeholder="ns1.example.com, ns2.example.com" style={{ ...inp as any, resize:"vertical", marginBottom:14 }}/>

            <label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-secondary)", cursor:"pointer", marginBottom:18 }}>
              <input type="checkbox" checked={manage.autoRenew} onChange={e=>setManage({...manage, autoRenew:e.target.checked})}/> {tr("Tự động gia hạn")}
            </label>

            <div style={{ display:"flex", gap:10, marginBottom:10 }}>
              <button onClick={()=>saveManage({ nameservers: ns, autoRenew: manage.autoRenew })} style={{ flex:1, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13, cursor:"pointer" }}>{tr("Lưu")}</button>
              {manage.status==="ACTIVE" && <button onClick={()=>saveManage({ action:"renew", years:1 })} style={{ flex:1, padding:"10px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-primary)", fontWeight:600, fontSize:13, cursor:"pointer" }}>{tr("Gia hạn 1 năm")}</button>}
            </div>

            {manage.status==="ACTIVE" && <DnsManager domainOrderId={manage.id} />}
            <button onClick={()=>setManage(null)} style={{ width:"100%", padding:"9px", background:"transparent", border:"none", color:"var(--text-muted)", fontSize:12.5, cursor:"pointer" }}>{tr("Đóng")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
