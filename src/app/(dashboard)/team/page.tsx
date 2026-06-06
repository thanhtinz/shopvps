"use client";
import { useState, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { useLocale } from "@/components/LocaleProvider";
import WarnIcon from "@/components/ui/WarnIcon";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p,i)=><path key={i} d={i===0?p:"M"+p}/>)}</svg>;
}

const PERMS = [
  { key: "canViewVps", label: "Xem VPS", group: "vps" },
  { key: "canPowerVps", label: "Bật/tắt VPS", group: "vps" },
  { key: "canViewPassword", label: "Xem mật khẩu root", group: "vps" },
  { key: "canRebuildVps", label: "Cài lại OS", group: "vps" },
  { key: "canChangePwVps", label: "Đổi mật khẩu VPS", group: "vps" },
  { key: "canViewHosting", label: "Xem Hosting", group: "hosting" },
  { key: "canAccessCpanel", label: "Đăng nhập cPanel", group: "hosting" },
  { key: "canChangeDomain", label: "Đổi domain", group: "hosting" },
  { key: "canChangePwHosting", label: "Đổi mật khẩu Hosting", group: "hosting" },
];

export default function TeamPage() {
  const { t: tr } = useLocale();
  const [team, setTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Record<string,boolean>>({ canViewVps: true, canViewHosting: true });
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/team").then(r=>r.json()).then(d => { setTeam(d.data); setLoading(false); });
  }, []);

  async function invite(e: React.FormEvent) {
    e.preventDefault(); setInviting(true); setError(""); setSuccess("");
    const res = await fetch("/api/team/invite", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: inviteEmail, permissions: selectedPerms }) });
    const data = await res.json();
    if (data.success) {
      setSuccess(`${tr("Đã mời")} ${inviteEmail} ${tr("thành công!")}`);
      setInviteEmail(""); setShowInvite(false);
      const t = await fetch("/api/team").then(r=>r.json());
      setTeam(t.data);
    } else setError(data.error);
    setInviting(false);
  }

  function togglePerm(key: string) {
    setSelectedPerms(p => ({ ...p, [key]: !p[key] }));
  }

  const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-surface)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" };

  if (loading) return <div style={{ maxWidth:800, margin:"0 auto" }}><div className="skeleton" style={{ height:300, borderRadius:"var(--radius-lg)" }}/></div>;

  return (
    <div style={{ maxWidth:800, margin:"0 auto" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:2 }}>{tr("Quản lý Team")}</h1>
          <p style={{ color:"var(--text-muted)", fontSize:13 }}>{tr("Chia sẻ quyền truy cập VPS/Hosting với thành viên")}</p>
        </div>
        <button onClick={()=>setShowInvite(true)} style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          <Icon d="M18 21a8 8 0 00-16 0 M10 8a4 4 0 108 0 4 4 0 00-8 0 M22 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75"/> {tr("Mời thành viên")}
        </button>
      </div>

      {success && <div style={{ background:"var(--green-soft)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"var(--radius-md)", padding:"10px 14px", color:"var(--green)", fontSize:13, marginBottom:16 }}>&#10003; {success}</div>}

      {/* Team info */}
      {team && (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px", marginBottom:18 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
            <div style={{ width:44, height:44, borderRadius:"var(--radius-md)", background:"var(--accent-soft)", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--accent)", fontSize:20 }}></div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--text-primary)" }}>{team.name}</div>
              <div style={{ fontSize:12, color:"var(--text-muted)" }}>{team.members?.length || 0} {tr("thành viên")}</div>
            </div>
          </div>

          {team.members?.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 0", color:"var(--text-muted)", fontSize:13 }}>
              {tr("Chưa có thành viên nào. Mời người dùng để bắt đầu cộng tác.")}
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {team.members?.map((m: any) => (
                <div key={m.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:"var(--bg-elevated)", borderRadius:"var(--radius-md)", border:"1px solid var(--border)" }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#4f7cff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"white", flexShrink:0 }}>
                    {m.user?.name?.[0] || "?"}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text-primary)" }}>{m.user?.name || m.email}</div>
                    <div style={{ fontSize:11.5, color:"var(--text-muted)" }}>{m.email}</div>
                  </div>
                  <Badge color={m.status==="ACCEPTED"?"green":m.status==="PENDING"?"yellow":"red"}>
                    {m.status==="ACCEPTED"?tr("Đã tham gia"):m.status==="PENDING"?tr("Chờ xác nhận"):tr("Từ chối")}
                  </Badge>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4, maxWidth:240 }}>
                    {PERMS.filter(p => m[p.key]).map(p => (
                      <span key={p.key} style={{ padding:"1px 6px", borderRadius:99, fontSize:10.5, background:"var(--accent-soft)", color:"var(--accent)", fontWeight:600 }}>{tr(p.label)}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!team && (
        <div style={{ textAlign:"center", padding:"60px 20px", background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)" }}>
          <div style={{ marginBottom:16, display:"flex", justifyContent:"center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
          <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:8 }}>{tr("Chưa có team")}</h3>
          <p style={{ color:"var(--text-muted)", fontSize:13, marginBottom:24 }}>{tr("Mời thành viên đầu tiên để tạo team")}</p>
          <button onClick={()=>setShowInvite(true)} style={{ padding:"10px 24px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:"pointer" }}>{tr("Mời ngay")}</button>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:50 }} onClick={()=>setShowInvite(false)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:500, maxWidth:"90vw" }} onClick={e=>e.stopPropagation()}>
            <h3 style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>{tr("Mời thành viên")}</h3>
            <form onSubmit={invite}>
              <div style={{ marginBottom:16 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{tr("Email thành viên")}</label>
                <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="user@example.com" required style={inputStyle}
                  onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>{tr("Phân quyền")}</label>
                {["vps","hosting"].map(group => (
                  <div key={group} style={{ marginBottom:12 }}>
                    <div style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", marginBottom:6, textTransform:"capitalize" }}>{group === "vps" ? " VPS" : " Hosting"}</div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                      {PERMS.filter(p=>p.group===group).map(p=>(
                        <button key={p.key} type="button" onClick={()=>togglePerm(p.key)} style={{
                          padding:"5px 10px", borderRadius:99, fontSize:12, cursor:"pointer", fontWeight:500, transition:"all 0.12s",
                          background: selectedPerms[p.key] ? "var(--accent-soft)" : "var(--bg-hover)",
                          border: `1.5px solid ${selectedPerms[p.key] ? "rgba(79,124,255,0.4)" : "var(--border)"}`,
                          color: selectedPerms[p.key] ? "var(--accent)" : "var(--text-secondary)",
                        }}>{tr(p.label)}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {error && <div style={{ background:"var(--red-soft)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--red)", fontSize:13, marginBottom:14 }}><WarnIcon /> {error}</div>}
              <div style={{ display:"flex", gap:10 }}>
                <button type="button" onClick={()=>setShowInvite(false)} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>{tr("Huỷ")}</button>
                <button type="submit" disabled={inviting} style={{ flex:2, padding:"10px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:inviting?"not-allowed":"pointer", fontSize:13 }}>
                  {inviting?tr("Đang mời..."):tr("Gửi lời mời →")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
