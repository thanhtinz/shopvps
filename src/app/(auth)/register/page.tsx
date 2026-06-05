"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const inputStyle = {
  width:"100%", boxSizing:"border-box" as const,
  background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.08)",
  borderRadius:10, padding:"11px 14px", color:"#e8edf5",
  fontSize:14, outline:"none", transition:"border 0.15s", fontFamily:"inherit",
};

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const ref = params.get("ref") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (password !== confirmPw) { setError("Mật khẩu xác nhận không khớp"); return; }
    if (password.length < 8) { setError("Mật khẩu tối thiểu 8 ký tự"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name, email, password, ref }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Đã có lỗi xảy ra"); return; }
      setSuccess(true);
    } catch { setError("Không thể kết nối máy chủ"); }
    finally { setLoading(false); }
  }

  if (success) return (
    <div style={{ textAlign:"center" }}>
      <div style={{ background:"rgba(13,17,23,0.95)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:20, padding:"40px 28px" }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:"rgba(34,197,94,0.1)", border:"2px solid rgba(34,197,94,0.3)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:28 }}></div>
        <h2 style={{ fontSize:18, fontWeight:800, color:"#e8edf5", marginBottom:8 }}>Kiểm tra email</h2>
        <p style={{ color:"#8896aa", fontSize:13, marginBottom:20, lineHeight:1.6 }}>Chúng tôi đã gửi link xác thực đến <strong style={{ color:"#e8edf5" }}>{email}</strong>. Vui lòng kiểm tra và xác thực tài khoản.</p>
        <Link href="/login" style={{ display:"inline-block", padding:"10px 24px", background:"#4f7cff", borderRadius:10, color:"white", textDecoration:"none", fontSize:13, fontWeight:600 }}>Đăng nhập →</Link>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:8, marginBottom:18, textDecoration:"none" }}>
          <div style={{ width:32, height:32, borderRadius:8, background:"linear-gradient(135deg,#4f7cff,#7c3aed)", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20M5 19v-4M19 19v-4"/></svg>
          </div>
          <span style={{ fontWeight:800, fontSize:17, color:"#e8edf5", letterSpacing:"-0.02em" }}>ShopVPS</span>
        </Link>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#e8edf5", letterSpacing:"-0.03em", marginBottom:4 }}>Tạo tài khoản</h1>
        <p style={{ color:"#4a5568", fontSize:13 }}>Bắt đầu sử dụng ShopVPS ngay hôm nay</p>
      </div>

      <div style={{ background:"rgba(13,17,23,0.95)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:20, padding:"28px", boxShadow:"0 20px 60px rgba(0,0,0,0.4)" }}>
        {ref && (
          <div style={{ background:"rgba(79,124,255,0.08)", border:"1px solid rgba(79,124,255,0.2)", borderRadius:8, padding:"9px 12px", marginBottom:16, fontSize:12.5, color:"#818cf8" }}>
             Bạn được giới thiệu — sẽ nhận ưu đãi đặc biệt
          </div>
        )}

        <button onClick={()=>signIn("google",{callbackUrl:"/dashboard"})} style={{ width:"100%", padding:"11px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#e8edf5", fontSize:13.5, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20 }}>
          <svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Tiếp tục với Google
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/><span style={{ color:"#4a5568", fontSize:12 }}>hoặc</span><div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }}/>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { label:"Họ tên", val:name, set:setName, type:"text", ph:"Nguyễn Văn A" },
            { label:"Email", val:email, set:setEmail, type:"email", ph:"name@example.com" },
          ].map(f => (
            <div key={f.label} style={{ marginBottom:13 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#4a5568", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{f.label}</label>
              <input type={f.type} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} required style={inputStyle}
                onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.08)"}/>
            </div>
          ))}
          <div style={{ marginBottom:13 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#4a5568", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Mật khẩu</label>
            <div style={{ position:"relative" }}>
              <input type={showPw?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Tối thiểu 8 ký tự" required style={{ ...inputStyle, paddingRight:42 }}
                onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.08)"}/>
              <button type="button" onClick={()=>setShowPw(!showPw)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#4a5568", cursor:"pointer" }}>{showPw?"":""}</button>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#4a5568", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Xác nhận mật khẩu</label>
            <input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} placeholder="Nhập lại mật khẩu" required style={{ ...inputStyle, borderColor: confirmPw && confirmPw !== password ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)" }}
              onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor=confirmPw&&confirmPw!==password?"rgba(239,68,68,0.5)":"rgba(255,255,255,0.08)"}/>
          </div>
          {error && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"10px 12px", color:"#ef4444", fontSize:13, marginBottom:14 }}>⚠ {error}</div>}
          <button type="submit" disabled={loading} style={{ width:"100%", padding:"12px", background:loading?"rgba(79,124,255,0.4)":"#4f7cff", border:"none", borderRadius:10, color:"white", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
            {loading?"Đang tạo tài khoản...":"Tạo tài khoản →"}
          </button>
          <p style={{ textAlign:"center", color:"#4a5568", fontSize:11.5, marginTop:12, lineHeight:1.5 }}>
            Bằng cách đăng ký, bạn đồng ý với <Link href="/terms" style={{ color:"#4f7cff", textDecoration:"none" }}>Điều khoản</Link> và <Link href="/privacy" style={{ color:"#4f7cff", textDecoration:"none" }}>Chính sách</Link>
          </p>
        </form>

        <p style={{ textAlign:"center", color:"#4a5568", fontSize:13, marginTop:18, borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:18 }}>
          Đã có tài khoản?{" "}<Link href="/login" style={{ color:"#4f7cff", textDecoration:"none", fontWeight:600 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
