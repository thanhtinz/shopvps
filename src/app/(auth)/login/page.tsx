"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";

const inputStyle = {
  width: "100%", boxSizing: "border-box" as const,
  background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)",
  borderRadius: 10, padding: "11px 14px", color: "#e8edf5",
  fontSize: 14, outline: "none", transition: "border 0.15s", fontFamily: "inherit",
};

export default function LoginPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [show2FA, setShow2FA] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    const res = await signIn("credentials", { email, password, totpCode, redirect: false });
    if (res?.error === "2FA_REQUIRED") { setShow2FA(true); setLoading(false); return; }
    if (res?.error) { setError(t("Email hoặc mật khẩu không đúng")); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:18, textDecoration:"none" }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#4f7cff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20M5 19v-4M19 19v-4"/></svg>
          </div>
          <span style={{ fontWeight:800, fontSize:17, color:"#e8edf5", letterSpacing:"-0.02em" }}>ShopVPS</span>
        </Link>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#e8edf5", letterSpacing:"-0.03em", marginBottom:4 }}>{show2FA ? t("Xác thực 2 lớp") : t("Đăng nhập")}</h1>
        <p style={{ color:"#4a5568", fontSize:13 }}>{show2FA ? t("Nhập mã từ ứng dụng xác thực") : t("Chào mừng trở lại!")}</p>
      </div>

      <div style={{ background:"rgba(13,17,23,0.95)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:20, padding:"28px", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        {!show2FA ? <>
          <button onClick={() => signIn("google",{callbackUrl:"/dashboard"})} style={{ width:"100%", padding:"11px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#e8edf5", fontSize:13.5, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20 }}>
            <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {t("Tiếp tục với Google")}
          </button>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
            <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/><span style={{ color:"#4a5568", fontSize:12 }}>{t("hoặc")}</span><div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:13 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#4a5568", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" required style={inputStyle}
                onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.08)"}/>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#4a5568", letterSpacing:"0.08em", textTransform:"uppercase" }}>{t("Mật khẩu")}</label>
                <Link href="/forgot-password" style={{ fontSize:12, color:"#4f7cff", textDecoration:"none" }}>{t("Quên mật khẩu?")}</Link>
              </div>
              <div style={{ position:"relative" }}>
                <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{ ...inputStyle, paddingRight:42 }}
                  onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.08)"}/>
                <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#4a5568", cursor:"pointer" }}>{showPw?"":""}</button>
              </div>
            </div>
            {error && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"10px 12px", color:"#ef4444", fontSize:13, marginBottom:14 }}>⚠ {error}</div>}
            <button type="submit" disabled={loading} style={{ width:"100%", padding:"12px", background:loading?"rgba(79,124,255,0.4)":"#4f7cff", border:"none", borderRadius:10, color:"white", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
              {loading?t("Đang đăng nhập..."):t("Đăng nhập →")}
            </button>
          </form>
        </> : (
          <form onSubmit={handleSubmit}>
            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"rgba(79,124,255,0.1)", border:"2px solid rgba(79,124,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", fontSize:22 }}></div>
              <p style={{ color:"#8896aa", fontSize:13 }}>{t("Nhập mã 6 chữ số từ Google Authenticator")}</p>
            </div>
            <input type="text" value={totpCode} onChange={e=>setTotpCode(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="000000" maxLength={6}
              style={{ ...inputStyle, textAlign:"center", fontSize:26, fontFamily:"monospace", letterSpacing:"0.35em", marginBottom:16 }}
              onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.08)"}/>
            {error && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"10px 12px", color:"#ef4444", fontSize:13, marginBottom:14 }}>⚠ {error}</div>}
            <button type="submit" disabled={loading||totpCode.length!==6} style={{ width:"100%", padding:"12px", background:totpCode.length===6?"#4f7cff":"rgba(79,124,255,0.3)", border:"none", borderRadius:10, color:"white", fontSize:14, fontWeight:700, cursor:totpCode.length===6?"pointer":"not-allowed" }}>
              {loading?t("Đang xác thực..."):t("Xác nhận")}
            </button>
            <button type="button" onClick={()=>{setShow2FA(false);setTotpCode("");}} style={{ width:"100%", marginTop:8, padding:"10px", background:"transparent", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, color:"#8896aa", fontSize:13, cursor:"pointer" }}>{t("← Quay lại")}</button>
          </form>
        )}
        <p style={{ textAlign:"center", color:"#4a5568", fontSize:13, marginTop:18 }}>
          {t("Chưa có tài khoản?")}{" "}<Link href="/register" style={{ color:"#4f7cff", textDecoration:"none", fontWeight:600 }}>{t("Đăng ký ngay")}</Link>
        </p>
      </div>
    </div>
  );
}
