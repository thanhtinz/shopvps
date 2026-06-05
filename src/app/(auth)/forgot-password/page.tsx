"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({email}),
      });
      const data = await res.json();
      if (data.success) setSent(true);
      else setError(data.error || "Đã có lỗi xảy ra");
    } catch { setError("Không thể kết nối máy chủ"); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <div style={{ textAlign:"center", marginBottom:28 }}>
        <Link href="/login" style={{ display:"inline-flex", alignItems:"center", gap:6, marginBottom:18, textDecoration:"none", color:"#8896aa", fontSize:13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Quay lại đăng nhập
        </Link>
        <h1 style={{ fontSize:22, fontWeight:800, color:"#e8edf5", letterSpacing:"-0.03em", marginBottom:4 }}>Quên mật khẩu</h1>
        <p style={{ color:"#4a5568", fontSize:13 }}>Nhập email để nhận link đặt lại</p>
      </div>
      <div style={{ background:"rgba(13,17,23,0.95)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:20, padding:"28px" }}>
        {!sent ? (
          <form onSubmit={handleSubmit}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#4a5568", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" required
              style={{ width:"100%", boxSizing:"border-box" as const, background:"rgba(255,255,255,0.04)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"11px 14px", color:"#e8edf5", fontSize:14, outline:"none", marginBottom:16, fontFamily:"inherit" }}
              onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="rgba(255,255,255,0.08)"}/>
            {error && <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:8, padding:"10px 12px", color:"#ef4444", fontSize:13, marginBottom:14 }}>⚠ {error}</div>}
            <button type="submit" disabled={loading} style={{ width:"100%", padding:"12px", background:loading?"rgba(79,124,255,0.4)":"#4f7cff", border:"none", borderRadius:10, color:"white", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>
              {loading?"Đang gửi...":"Gửi link đặt lại →"}
            </button>
          </form>
        ) : (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ marginBottom:12, display:"flex", justifyContent:"center" }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6"/></svg></div>
            <h3 style={{ fontSize:16, fontWeight:700, color:"#e8edf5", marginBottom:8 }}>Kiểm tra email</h3>
            <p style={{ color:"#8896aa", fontSize:13, lineHeight:1.6, marginBottom:20 }}>Chúng tôi đã gửi link đến <strong style={{ color:"#e8edf5" }}>{email}</strong>. Kiểm tra cả hộp thư spam.</p>
            <Link href="/login" style={{ color:"#4f7cff", textDecoration:"none", fontSize:13, fontWeight:600 }}>← Quay lại đăng nhập</Link>
          </div>
        )}
      </div>
    </div>
  );
}
