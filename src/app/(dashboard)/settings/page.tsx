"use client";
import { useState, useEffect } from "react";
import { useAppearance } from "@/components/AppearanceProvider";
import { ACCENT_PRESETS, FONT_PRESETS } from "@/lib/appearance";

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d.split(" M").map((p,i)=><path key={i} d={i===0?p:"M"+p}/>)}</svg>;
}

type Tab = "profile" | "appearance" | "security" | "2fa";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13.5, outline:"none", fontFamily:"inherit" };

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const { appearance, update, reset } = useAppearance();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState("");
  const [billing, setBilling] = useState<any>({ company: "", phone: "", address: "", city: "", country: "", taxId: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

  // Security
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  // 2FA
  const [qrUrl, setQrUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [twoFAStep, setTwoFAStep] = useState<"idle"|"setup"|"verify">("idle");
  const [twoFAMsg, setTwoFAMsg] = useState("");
  const [twoFAError, setTwoFAError] = useState("");

  useEffect(() => {
    fetch("/api/user/profile").then(r=>r.json()).then(d=>{ setProfile(d.data); setName(d.data?.name||""); setBilling({ company:d.data?.company||"", phone:d.data?.phone||"", address:d.data?.address||"", city:d.data?.city||"", country:d.data?.country||"", taxId:d.data?.taxId||"" }); });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault(); setSavingProfile(true); setProfileMsg("");
    const res = await fetch("/api/user/profile", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ name, ...billing }) });
    const data = await res.json();
    if (data.success) setProfileMsg("Đã lưu thay đổi!");
    setSavingProfile(false); setTimeout(()=>setProfileMsg(""), 3000);
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwError(""); setPwMsg("");
    if (newPw !== confirmPw) { setPwError("Mật khẩu xác nhận không khớp"); return; }
    setSavingPw(true);
    const res = await fetch("/api/user/password", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ currentPassword:currentPw, newPassword:newPw }) });
    const data = await res.json();
    if (data.success) { setPwMsg("Đã đổi mật khẩu thành công!"); setCurrentPw(""); setNewPw(""); setConfirmPw(""); }
    else setPwError(data.error);
    setSavingPw(false);
  }

  async function setup2FA() {
    setTwoFAError(""); setTwoFAStep("setup");
    const res = await fetch("/api/user/2fa", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"generate" }) });
    const data = await res.json();
    if (data.success) { setQrUrl(data.data.qrUrl); setSecret(data.data.secret); setTwoFAStep("verify"); }
  }

  async function enable2FA() {
    setTwoFAError("");
    const res = await fetch("/api/user/2fa", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"enable", token:totpToken }) });
    const data = await res.json();
    if (data.success) { setTwoFAMsg("Đã bật xác thực 2 lớp!"); setTwoFAStep("idle"); setTotpToken(""); setProfile((p:any)=>({...p, twoFactorEnabled:true})); }
    else setTwoFAError(data.error);
  }

  async function disable2FA() {
    setTwoFAError("");
    const res = await fetch("/api/user/2fa", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"disable", token:totpToken }) });
    const data = await res.json();
    if (data.success) { setTwoFAMsg("Đã tắt xác thực 2 lớp."); setTotpToken(""); setProfile((p:any)=>({...p, twoFactorEnabled:false})); }
    else setTwoFAError(data.error);
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key:"profile", label:"Thông tin", icon:"M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8" },
    { key:"appearance", label:"Giao diện", icon:"M12 2a10 10 0 100 20 10 10 0 000-20z M12 2a4 4 0 010 8 M2 12h8" },
    { key:"security", label:"Bảo mật", icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" },
    { key:"2fa", label:"Xác thực 2 lớp", icon:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10 M9 12l2 2 4-4" },
  ];

  return (
    <div style={{ maxWidth:700, margin:"0 auto" }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:24 }}>Cài đặt tài khoản</h1>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:"var(--bg-elevated)", borderRadius:"var(--radius-md)", padding:4, width:"fit-content", marginBottom:24 }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)} style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 16px", borderRadius:"var(--radius-sm)", border:"none", cursor:"pointer", fontSize:13, fontWeight:600, transition:"all 0.15s", background:tab===t.key?"var(--bg-surface)":"transparent", color:tab===t.key?"var(--text-primary)":"var(--text-muted)", boxShadow:tab===t.key?"0 1px 4px rgba(0,0,0,0.3)":"none" }}>
            <Icon d={t.icon} size={13}/>{t.label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === "profile" && (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, paddingBottom:20, borderBottom:"1px solid var(--border)" }}>
            <div style={{ width:60, height:60, borderRadius:"50%", background:"linear-gradient(135deg,#4f7cff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"white", flexShrink:0 }}>
              {profile?.name?.[0] || "?"}
            </div>
            <div>
              <div style={{ fontSize:16, fontWeight:700, color:"var(--text-primary)" }}>{profile?.name}</div>
              <div style={{ fontSize:13, color:"var(--text-muted)" }}>{profile?.email}</div>
              <div style={{ fontSize:11.5, color:"var(--text-muted)", marginTop:2 }}>
                {profile?.emailVerified ? "&#10003; Email đã xác thực" : "⚠ Email chưa xác thực"}
              </div>
            </div>
          </div>
          <form onSubmit={saveProfile}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Họ tên</label>
              <input value={name} onChange={e=>setName(e.target.value)} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
            </div>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Email</label>
              <input value={profile?.email||""} disabled style={{ ...inputStyle, opacity:0.5, cursor:"not-allowed" }}/>
            </div>

            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", margin:"4px 0 12px", paddingTop:8, borderTop:"1px solid var(--border)" }}>Thông tin xuất hoá đơn</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
              {[
                { k:"company", l:"Công ty" },
                { k:"phone", l:"Số điện thoại" },
                { k:"address", l:"Địa chỉ" },
                { k:"city", l:"Thành phố" },
                { k:"country", l:"Quốc gia" },
                { k:"taxId", l:"Mã số thuế" },
              ].map(f=>(
                <div key={f.k}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{f.l}</label>
                  <input value={billing[f.k]} onChange={e=>setBilling({ ...billing, [f.k]: e.target.value })} style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              ))}
            </div>
            {profileMsg && <div style={{ background:"var(--green-soft)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"var(--radius-md)", padding:"8px 12px", color:"var(--green)", fontSize:13, marginBottom:14 }}>&#10003; {profileMsg}</div>}
            <button type="submit" disabled={savingProfile} style={{ padding:"10px 20px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {savingProfile?"Đang lưu...":"Lưu thay đổi"}
            </button>
          </form>
        </div>
      )}

      {/* Appearance tab */}
      {tab === "appearance" && (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"24px", maxWidth:620 }}>
          {/* Theme */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Chế độ</div>
            <div style={{ display:"flex", gap:10 }}>
              {([["dark","Tối"],["light","Sáng"]] as const).map(([v,l])=>(
                <button key={v} onClick={()=>update({ theme:v })} style={{ flex:1, padding:"12px", borderRadius:"var(--radius-md)", border:`1.5px solid ${appearance.theme===v?"var(--accent)":"var(--border)"}`, background:appearance.theme===v?"var(--accent-soft)":"var(--bg-elevated)", color:appearance.theme===v?"var(--accent)":"var(--text-secondary)", fontSize:13, fontWeight:600, cursor:"pointer" }}>{l}</button>
              ))}
            </div>
          </div>

          {/* Accent color */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Màu nhấn</div>
            <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
              {ACCENT_PRESETS.map(c=>(
                <button key={c} onClick={()=>update({ accent:c })} aria-label={c} style={{ width:30, height:30, borderRadius:"50%", background:c, border:appearance.accent===c?"3px solid var(--text-primary)":"2px solid var(--border)", cursor:"pointer" }}/>
              ))}
              <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12.5, color:"var(--text-muted)", cursor:"pointer" }}>
                Tuỳ chọn
                <input type="color" value={appearance.accent} onChange={e=>update({ accent:e.target.value })} style={{ width:30, height:30, border:"none", background:"none", cursor:"pointer", padding:0 }}/>
              </label>
            </div>
          </div>

          {/* Font */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Phông chữ</div>
            <select value={appearance.font} onChange={e=>update({ font:e.target.value })} style={inputStyle}>
              {FONT_PRESETS.map(f=><option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          {/* Font size */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>
              <span>Cỡ chữ</span><span style={{ color:"var(--accent)" }}>{Math.round(appearance.fontScale*100)}%</span>
            </div>
            <input type="range" min={0.85} max={1.3} step={0.05} value={appearance.fontScale} onChange={e=>update({ fontScale:parseFloat(e.target.value) })} style={{ width:"100%", accentColor:"var(--accent)" }}/>
          </div>

          {/* Direction */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Hướng bố cục</div>
            <div style={{ display:"flex", gap:10 }}>
              {([["ltr","Trái → Phải (LTR)"],["rtl","Phải → Trái (RTL)"]] as const).map(([v,l])=>(
                <button key={v} onClick={()=>update({ dir:v })} style={{ flex:1, padding:"10px", borderRadius:"var(--radius-md)", border:`1.5px solid ${appearance.dir===v?"var(--accent)":"var(--border)"}`, background:appearance.dir===v?"var(--accent-soft)":"var(--bg-elevated)", color:appearance.dir===v?"var(--accent)":"var(--text-secondary)", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>{l}</button>
              ))}
            </div>
          </div>

          <button onClick={reset} style={{ padding:"9px 16px", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", fontSize:13, fontWeight:600, cursor:"pointer" }}>Khôi phục mặc định</button>
          <p style={{ fontSize:11.5, color:"var(--text-muted)", marginTop:14 }}>Tuỳ chỉnh được lưu trên trình duyệt này và áp dụng tức thì.</p>
        </div>
      )}

      {/* Security tab */}
      {tab === "security" && (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"24px" }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", marginBottom:20 }}>Đổi mật khẩu</h3>
          <form onSubmit={changePassword}>
            {[
              { label:"Mật khẩu hiện tại", val:currentPw, set:setCurrentPw },
              { label:"Mật khẩu mới", val:newPw, set:setNewPw },
              { label:"Xác nhận mật khẩu mới", val:confirmPw, set:setConfirmPw },
            ].map(f=>(
              <div key={f.label} style={{ marginBottom:14 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{f.label}</label>
                <input type="password" value={f.val} onChange={e=>f.set(e.target.value)} required style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              </div>
            ))}
            {pwError && <div style={{ background:"var(--red-soft)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--red)", fontSize:13, marginBottom:14 }}>⚠ {pwError}</div>}
            {pwMsg && <div style={{ background:"var(--green-soft)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--green)", fontSize:13, marginBottom:14 }}>&#10003; {pwMsg}</div>}
            <button type="submit" disabled={savingPw} style={{ padding:"10px 20px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:600, cursor:"pointer" }}>
              {savingPw?"Đang đổi...":"Đổi mật khẩu"}
            </button>
          </form>
        </div>
      )}

      {/* 2FA tab */}
      {tab === "2fa" && (
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"24px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20, paddingBottom:18, borderBottom:"1px solid var(--border)" }}>
            <div style={{ width:44, height:44, borderRadius:"var(--radius-md)", background:profile?.twoFactorEnabled?"var(--green-soft)":"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>
              {profile?.twoFactorEnabled?"":""}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>Xác thực 2 lớp (2FA)</div>
              <div style={{ fontSize:12.5, color: profile?.twoFactorEnabled?"var(--green)":"var(--text-muted)" }}>
                {profile?.twoFactorEnabled ? "&#10003; Đang bật — tài khoản được bảo vệ" : "Chưa bật — tài khoản có thể bị xâm nhập"}
              </div>
            </div>
          </div>

          {twoFAMsg && <div style={{ background:"var(--green-soft)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--green)", fontSize:13, marginBottom:16 }}>&#10003; {twoFAMsg}</div>}
          {twoFAError && <div style={{ background:"var(--red-soft)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--red)", fontSize:13, marginBottom:16 }}>⚠ {twoFAError}</div>}

          {!profile?.twoFactorEnabled && twoFAStep === "idle" && (
            <div>
              <p style={{ color:"var(--text-secondary)", fontSize:13, marginBottom:16, lineHeight:1.7 }}>Bật 2FA để thêm lớp bảo vệ. Mỗi lần đăng nhập sẽ yêu cầu mã từ ứng dụng Google Authenticator.</p>
              <button onClick={setup2FA} style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:"var(--green-soft)", border:"1.5px solid rgba(34,197,94,0.3)", borderRadius:"var(--radius-md)", color:"var(--green)", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/> Bật xác thực 2 lớp
              </button>
            </div>
          )}

          {twoFAStep === "verify" && (
            <div>
              <p style={{ color:"var(--text-secondary)", fontSize:13, marginBottom:16 }}>Quét mã QR bằng Google Authenticator, sau đó nhập mã 6 số để xác nhận.</p>
              {qrUrl && <div style={{ textAlign:"center", marginBottom:16 }}><img src={qrUrl} alt="QR Code" style={{ width:160, height:160, borderRadius:"var(--radius-md)", border:"1px solid var(--border)" }}/></div>}
              <div style={{ background:"var(--bg-elevated)", borderRadius:"var(--radius-md)", padding:"10px 14px", marginBottom:16, fontSize:12, color:"var(--text-secondary)" }}>
                Nhập thủ công: <span style={{ fontFamily:"var(--font-mono)", color:"var(--accent)", letterSpacing:"0.1em" }}>{secret}</span>
              </div>
              <input type="text" value={totpToken} onChange={e=>setTotpToken(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" maxLength={6}
                style={{ ...inputStyle, textAlign:"center", fontSize:22, fontFamily:"monospace", letterSpacing:"0.3em", marginBottom:12 }}
                onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={()=>setTwoFAStep("idle")} style={{ flex:1, padding:"10px", background:"var(--bg-hover)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", color:"var(--text-secondary)", cursor:"pointer", fontSize:13 }}>Huỷ</button>
                <button onClick={enable2FA} disabled={totpToken.length!==6} style={{ flex:2, padding:"10px", background:totpToken.length===6?"var(--green)":"rgba(34,197,94,0.3)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, cursor:totpToken.length===6?"pointer":"not-allowed", fontSize:13 }}>Xác nhận bật 2FA</button>
              </div>
            </div>
          )}

          {profile?.twoFactorEnabled && twoFAStep === "idle" && (
            <div>
              <p style={{ color:"var(--text-secondary)", fontSize:13, marginBottom:16 }}>Nhập mã từ ứng dụng xác thực để tắt 2FA.</p>
              <input type="text" value={totpToken} onChange={e=>setTotpToken(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" maxLength={6}
                style={{ ...inputStyle, textAlign:"center", fontSize:22, fontFamily:"monospace", letterSpacing:"0.3em", marginBottom:12 }}
                onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
              <button onClick={disable2FA} disabled={totpToken.length!==6} style={{ padding:"10px 20px", background:totpToken.length===6?"var(--red-soft)":"rgba(239,68,68,0.1)", border:`1.5px solid ${totpToken.length===6?"rgba(239,68,68,0.3)":"transparent"}`, borderRadius:"var(--radius-md)", color:totpToken.length===6?"var(--red)":"rgba(239,68,68,0.4)", fontSize:13, fontWeight:600, cursor:totpToken.length===6?"pointer":"not-allowed" }}>
                Tắt xác thực 2 lớp
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
