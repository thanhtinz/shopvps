"use client";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import RevenueChart from "@/components/admin/RevenueChart";
import { useLocale } from "@/components/LocaleProvider";

const ICON_PATHS: Record<string,string> = {
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M9 11a4 4 0 100-8 4 4 0 000 8z",
  server: "M2 2h20v8H2z M2 14h20v8H2z M6 6h.01 M6 18h.01",
  globe: "M12 2a10 10 0 100 20A10 10 0 0012 2z M2 12h20",
  ticket: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
  trending: "M23 6l-9.5 9.5-5-5L1 18 M17 6h6v6",
  wallet: "M20 12V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h6 M16 16h6 M19 13v6",
};

function StatBox({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const d = ICON_PATHS[icon] || ICON_PATHS.server;
  return (
    <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
        <span style={{ fontSize:12.5, color:"var(--text-secondary)" }}>{title}</span>
        <div style={{ width:34, height:34, borderRadius:"var(--radius-md)", background:`${color}18`, display:"flex", alignItems:"center", justifyContent:"center", color }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            {d.split(" M").map((p: string, i: number) => <path key={i} d={i===0?p:"M"+p}/>)}
          </svg>
        </div>
      </div>
      <div style={{ fontSize:28, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em" }}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useLocale();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then(r=>r.json()),
      fetch("/api/admin/users?page=1").then(r=>r.json()),
    ]).then(([s,u]) => { setStats(s.data); setUsers(u.data?.users||[]); setLoading(false); });
  }, []);

  async function toggleUser(userId: string) {
    await fetch("/api/admin/users", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ userId, action:"toggle_status" }) });
    const res = await fetch("/api/admin/users").then(r=>r.json());
    setUsers(res.data?.users||[]);
  }

  if (loading) return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:24 }}>
        {[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{ height:100, borderRadius:"var(--radius-lg)" }}/>)}
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:4 }}>Admin Dashboard</h1>
        <p style={{ color:"var(--text-muted)", fontSize:13 }}>{t("Tổng quan hệ thống")}</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:14, marginBottom:28 }}>
        <StatBox title={t("Tổng người dùng")} value={stats?.totalUsers||0} icon="users" color="var(--accent)"/>
        <StatBox title={t("VPS đang hoạt động")} value={stats?.activeVps||0} icon="server" color="var(--cyan)"/>
        <StatBox title={t("Hosting đang hoạt động")} value={stats?.activeHosting||0} icon="globe" color="var(--purple)"/>
        <StatBox title={t("Ticket chờ xử lý")} value={stats?.pendingTickets||0} icon="ticket" color="var(--yellow)"/>
        <StatBox title={t("Doanh thu hôm nay")} value={formatCurrency(stats?.todayRevenue||0)} icon="trending" color="var(--green)"/>
        <StatBox title={t("Tổng số dư ví")} value={formatCurrency(stats?.totalBalance||0)} icon="wallet" color="var(--accent)"/>
      </div>

      <RevenueChart />

      {/* Users table */}
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{t("Người dùng gần đây")}</span>
          <a href="/admin/users" style={{ fontSize:12, color:"var(--accent)", textDecoration:"none" }}>{t("Xem tất cả →")}</a>
        </div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {[t("Người dùng"),t("Email"),t("Số dư"),t("Trạng thái"),t("Ngày tạo"),t("Thao tác")].map(h=>(
                  <th key={h} style={{ padding:"11px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.slice(0,10).map(u=>(
                <tr key={u.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--bg-hover)"}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}
                >
                  <td style={{ padding:"12px 16px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#4f7cff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"white", flexShrink:0 }}>
                        {u.name?.[0]||"?"}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{u.name||"—"}</div>
                        {u.role !== "USER" && <div style={{ fontSize:10, color:"#ef4444", fontWeight:600 }}>{u.role}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:12.5, color:"var(--text-secondary)" }}>{u.email}</td>
                  <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{formatCurrency(u.balance)}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <span style={{ padding:"2px 8px", borderRadius:99, fontSize:11.5, fontWeight:600, background:u.status==="ACTIVE"?"var(--green-soft)":"var(--red-soft)", color:u.status==="ACTIVE"?"var(--green)":"var(--red)" }}>
                      {u.status==="ACTIVE"?t("Hoạt động"):t("Bị khoá")}
                    </span>
                  </td>
                  <td style={{ padding:"12px 16px", fontSize:12, color:"var(--text-muted)", whiteSpace:"nowrap" }}>{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                  <td style={{ padding:"12px 16px" }}>
                    <button onClick={()=>toggleUser(u.id)} style={{ padding:"5px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:u.status==="ACTIVE"?"var(--red)":"var(--green)", fontSize:12, cursor:"pointer", fontWeight:600 }}>
                      {u.status==="ACTIVE"?t("Khoá"):t("Mở khoá")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
