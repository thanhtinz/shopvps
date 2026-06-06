"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

function shortMonth(k: string) { const [, m] = k.split("-"); return `T${parseInt(m)}`; }

export default function AdminReportsPage() {
  const { t } = useLocale();
  const [data, setData] = useState<any>(null);
  const [months, setMonths] = useState(12);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => { fetch(`/api/admin/reports?months=${months}`).then(r=>r.json()).then(d=>setData(d.data||null)); }, [months]);

  if (!data) return <div className="skeleton" style={{ height:400, borderRadius:"var(--radius-lg)" }}/>;

  const max = Math.max(1, ...data.monthly.map((m: any) => Math.max(m.revenue, m.deposits)));
  const W = 820, H = 200, pad = 6;
  const bw = (W - pad * 2) / data.monthly.length;

  const cards = [
    { label: t("Doanh thu"), value: formatCurrency(data.totals.revenue), color: "var(--green)" },
    { label: t("Tiền nạp"), value: formatCurrency(data.totals.deposits), color: "var(--accent)" },
    { label: t("VAT đã thu"), value: formatCurrency(data.totals.vatCollected), color: "var(--purple)" },
    { label: t("Hoàn tiền"), value: formatCurrency(data.totals.refunds), color: "var(--yellow)" },
    { label: t("Khách mới"), value: data.totals.newUsers, color: "var(--cyan)" },
    { label: t("Huỷ dịch vụ (churn)"), value: data.totals.churn, color: "var(--red)" },
    { label: t("Giá trị đơn TB"), value: formatCurrency(data.totals.avgOrderValue), color: "var(--text-primary)" },
  ];
  const products = [
    { label: "VPS", active: data.activeServices.vps, neworders: data.newOrders.vps, color: "var(--cyan)" },
    { label: "Hosting", active: data.activeServices.hosting, neworders: data.newOrders.hosting, color: "var(--purple)" },
    { label: t("Tên miền"), active: data.activeServices.domain, neworders: data.newOrders.domain, color: "var(--green)" },
  ];
  const prodMax = Math.max(1, ...products.map(p => p.neworders));

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{t("Báo cáo")}</h1>
        <div style={{ display:"flex", gap:4, background:"var(--bg-elevated)", borderRadius:"var(--radius-md)", padding:4 }}>
          {[6,12,24].map(m=>(
            <button key={m} onClick={()=>setMonths(m)} style={{ padding:"7px 14px", borderRadius:"var(--radius-sm)", border:"none", cursor:"pointer", fontSize:12.5, fontWeight:600, background:months===m?"var(--bg-surface)":"transparent", color:months===m?"var(--text-primary)":"var(--text-muted)" }}>{m} {t("tháng")}</button>
          ))}
        </div>
      </div>

      <ExportCsv t={t} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))", gap:12, marginBottom:24 }}>
        {cards.map(c=>(
          <div key={c.label} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"16px 18px" }}>
            <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:6 }}>{c.label}</div>
            <div style={{ fontSize:19, fontWeight:900, color:c.color, letterSpacing:"-0.02em" }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{t("Doanh thu theo tháng")}</span>
          <div style={{ display:"flex", gap:14, fontSize:11.5, color:"var(--text-muted)" }}>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}><i style={{ width:9, height:9, borderRadius:2, background:"var(--green)" }}/>{t("Doanh thu")}</span>
            <span style={{ display:"flex", alignItems:"center", gap:5 }}><i style={{ width:9, height:9, borderRadius:2, background:"var(--accent)", opacity:0.45 }}/>{t("Tiền nạp")}</span>
          </div>
        </div>
        <div style={{ position:"relative" }}>
          <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" onMouseLeave={()=>setHover(null)}>
            {data.monthly.map((m: any, i: number) => {
              const x = pad + i * bw;
              const rh = (m.revenue / max) * (H - 12);
              const dh = (m.deposits / max) * (H - 12);
              return (
                <g key={m.month} onMouseEnter={()=>setHover(i)}>
                  <rect x={x} y={0} width={bw} height={H} fill={hover===i?"var(--bg-hover)":"transparent"} />
                  <rect x={x + bw*0.2} y={H - dh} width={bw*0.28} height={dh} rx={1.5} fill="var(--accent)" opacity={0.4} />
                  <rect x={x + bw*0.5} y={H - rh} width={bw*0.28} height={rh} rx={1.5} fill="var(--green)" />
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div style={{ position:"absolute", top:0, left:`${(hover/data.monthly.length)*100}%`, transform:"translateX(-50%)", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"7px 10px", fontSize:11.5, pointerEvents:"none", whiteSpace:"nowrap", zIndex:2 }}>
              <div style={{ fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{data.monthly[hover].month}</div>
              <div style={{ color:"var(--green)" }}>{t("DT:")} {formatCurrency(data.monthly[hover].revenue)}</div>
              <div style={{ color:"var(--accent)" }}>{t("Nạp:")} {formatCurrency(data.monthly[hover].deposits)}</div>
              <div style={{ color:"var(--text-muted)" }}>{t("User mới:")} {data.monthly[hover].newUsers}</div>
            </div>
          )}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:10.5, color:"var(--text-muted)" }}>
          {data.monthly.map((m: any) => <span key={m.month}>{shortMonth(m.month)}</span>)}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Product distribution */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:16 }}>{t("Sản phẩm (đơn mới")} {months} {t("tháng)")}</div>
          {products.map(p=>(
            <div key={p.label} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:5 }}>
                <span style={{ color:"var(--text-primary)", fontWeight:600 }}>{p.label} <span style={{ color:"var(--text-muted)", fontWeight:400, fontSize:11 }}>· {p.active} {t("đang chạy")}</span></span>
                <span style={{ color:"var(--text-secondary)", fontWeight:700 }}>{p.neworders}</span>
              </div>
              <div style={{ height:7, background:"var(--bg-elevated)", borderRadius:99, overflow:"hidden" }}>
                <div style={{ width:`${(p.neworders/prodMax)*100}%`, height:"100%", background:p.color, borderRadius:99 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Top customers */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:14 }}>{t("Khách hàng chi tiêu nhiều")}</div>
          {data.topCustomers.length===0 ? (
            <div style={{ fontSize:12.5, color:"var(--text-muted)", padding:"20px 0", textAlign:"center" }}>{t("Chưa có dữ liệu")}</div>
          ) : data.topCustomers.map((c: any, i: number)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<data.topCustomers.length-1?"1px solid var(--border)":"none" }}>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{c.name}</div>
                <div style={{ fontSize:11.5, color:"var(--text-muted)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.email}</div>
              </div>
              <span style={{ fontSize:13, fontWeight:700, color:"var(--green)", whiteSpace:"nowrap", marginLeft:10 }}>{formatCurrency(c.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExportCsv({ t }: { t: (k: string) => string }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const dl = (type: string) => {
    const qs = new URLSearchParams({ type });
    if (from) qs.set("from", from);
    if (to) qs.set("to", new Date(to + "T23:59:59").toISOString());
    window.open(`/api/admin/export?${qs.toString()}`, "_blank");
  };
  const inp = { background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"8px 10px", fontSize:12.5, color:"var(--text-primary)", colorScheme:"dark" as const };
  const btn = { padding:"8px 14px", borderRadius:"var(--radius-md)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--accent)", fontSize:12.5, fontWeight:600, cursor:"pointer" };
  return (
    <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"16px 18px", marginBottom:24, display:"flex", gap:10, alignItems:"flex-end", flexWrap:"wrap" }}>
      <div>
        <label style={{ display:"block", fontSize:11, color:"var(--text-muted)", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.05em" }}>{t("Xuất CSV để đối soát")}</label>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inp} />
          <span style={{ color:"var(--text-muted)" }}>→</span>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inp} />
        </div>
      </div>
      <button onClick={()=>dl("transactions")} style={btn}>{t("Giao dịch")}</button>
      <button onClick={()=>dl("invoices")} style={btn}>{t("Hoá đơn")}</button>
      <button onClick={()=>dl("payouts")} style={btn}>{t("Rút tiền")}</button>
    </div>
  );
}
