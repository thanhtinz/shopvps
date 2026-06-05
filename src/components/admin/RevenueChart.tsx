"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/components/LocaleProvider";

type Daily = { date: string; revenue: number; deposits: number; newUsers: number };
type Data = { daily: Daily[]; topPackages: { name: string; type: string; count: number }[]; todayRevenue: number; monthRevenue: number; totalRevenue: number };

function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

export default function RevenueChart() {
  const { t } = useLocale();
  const [data, setData] = useState<Data | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/revenue").then(r => r.json()).then(d => setData(d.data || null)).catch(() => {});
  }, []);

  if (!data) return <div className="skeleton" style={{ height:280, borderRadius:"var(--radius-lg)", marginBottom:28 }} />;

  const max = Math.max(1, ...data.daily.map(d => Math.max(d.revenue, d.deposits)));
  const W = 760, H = 180, pad = 4;
  const bw = (W - pad * 2) / data.daily.length;
  const topMax = Math.max(1, ...data.topPackages.map(p => p.count));

  return (
    <div style={{ marginBottom:28 }}>
      {/* Revenue totals */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:14 }}>
        {[
          { label:t("Doanh thu hôm nay"), value:data.todayRevenue, color:"var(--green)" },
          { label:t("Doanh thu tháng này"), value:data.monthRevenue, color:"var(--accent)" },
          { label:t("Tổng doanh thu"), value:data.totalRevenue, color:"var(--purple)" },
        ].map(s => (
          <div key={s.label} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"16px 18px" }}>
            <div style={{ fontSize:12, color:"var(--text-secondary)", marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:22, fontWeight:900, color:s.color, letterSpacing:"-0.03em" }}>{formatCurrency(s.value)}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:14 }}>
        {/* Daily chart */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
            <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{t("Doanh thu 30 ngày")}</span>
            <div style={{ display:"flex", gap:14, fontSize:11.5, color:"var(--text-muted)" }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><i style={{ width:9, height:9, borderRadius:2, background:"var(--green)" }}/>{t("Mua dịch vụ")}</span>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><i style={{ width:9, height:9, borderRadius:2, background:"var(--accent)", opacity:0.45 }}/>{t("Nạp tiền")}</span>
            </div>
          </div>
          <div style={{ position:"relative" }}>
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" onMouseLeave={()=>setHover(null)}>
              {data.daily.map((d, i) => {
                const x = pad + i * bw;
                const rh = (d.revenue / max) * (H - 10);
                const dh = (d.deposits / max) * (H - 10);
                return (
                  <g key={d.date} onMouseEnter={()=>setHover(i)}>
                    <rect x={x} y={0} width={bw} height={H} fill={hover===i?"var(--bg-hover)":"transparent"} />
                    <rect x={x + bw*0.18} y={H - dh} width={bw*0.3} height={dh} rx={1.5} fill="var(--accent)" opacity={0.4} />
                    <rect x={x + bw*0.5} y={H - rh} width={bw*0.3} height={rh} rx={1.5} fill="var(--green)" />
                  </g>
                );
              })}
            </svg>
            {hover !== null && (
              <div style={{ position:"absolute", top:0, left:`${(hover/data.daily.length)*100}%`, transform:"translateX(-50%)", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"7px 10px", fontSize:11.5, pointerEvents:"none", whiteSpace:"nowrap", zIndex:2, boxShadow:"0 4px 12px rgba(0,0,0,0.15)" }}>
                <div style={{ fontWeight:700, color:"var(--text-primary)", marginBottom:3 }}>{shortDate(data.daily[hover].date)}</div>
                <div style={{ color:"var(--green)" }}>{t("Mua:")} {formatCurrency(data.daily[hover].revenue)}</div>
                <div style={{ color:"var(--accent)" }}>{t("Nạp:")} {formatCurrency(data.daily[hover].deposits)}</div>
                <div style={{ color:"var(--text-muted)" }}>{t("User mới:")} {data.daily[hover].newUsers}</div>
              </div>
            )}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:10.5, color:"var(--text-muted)" }}>
            <span>{shortDate(data.daily[0]?.date || "")}</span>
            <span>{shortDate(data.daily[Math.floor(data.daily.length/2)]?.date || "")}</span>
            <span>{shortDate(data.daily[data.daily.length-1]?.date || "")}</span>
          </div>
        </div>

        {/* Top packages */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"18px 20px" }}>
          <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:14 }}>{t("Gói bán chạy")}</div>
          {data.topPackages.length === 0 ? (
            <div style={{ fontSize:12.5, color:"var(--text-muted)", padding:"20px 0", textAlign:"center" }}>{t("Chưa có dữ liệu")}</div>
          ) : data.topPackages.map((p, i) => (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, marginBottom:4 }}>
                <span style={{ color:"var(--text-primary)", fontWeight:600 }}>{p.name} <span style={{ color:"var(--text-muted)", fontWeight:400, fontSize:11 }}>· {p.type}</span></span>
                <span style={{ color:"var(--text-secondary)", fontWeight:700 }}>{p.count}</span>
              </div>
              <div style={{ height:6, background:"var(--bg-elevated)", borderRadius:99, overflow:"hidden" }}>
                <div style={{ width:`${(p.count/topMax)*100}%`, height:"100%", background:p.type==="VPS"?"var(--cyan)":"var(--purple)", borderRadius:99 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
