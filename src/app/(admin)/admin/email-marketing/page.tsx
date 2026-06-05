"use client";
import { useState } from "react";

export default function EmailMarketingPage() {
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState(`<h2>Xin chào {{name}},</h2>\n<p>Nội dung email của bạn tại đây.</p>`);
  const [target, setTarget] = useState("USER");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault(); setSending(true); setResult(null);
    const res = await fetch("/api/admin/email-marketing", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ subject, html, targetRole: target !== "ALL" ? target : undefined }) });
    const data = await res.json();
    setResult(data); setSending(false);
  }

  const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"10px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

  return (
    <div style={{ maxWidth:800 }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:24 }}>Email Marketing</h1>
      <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"24px" }}>
        <form onSubmit={send}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Đối tượng</label>
            <select value={target} onChange={e=>setTarget(e.target.value)} style={{ ...inputStyle, cursor:"pointer" }}>
              <option value="ALL">Tất cả người dùng</option>
              <option value="USER">Chỉ User</option>
              <option value="ADMIN">Chỉ Admin</option>
            </select>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Tiêu đề email</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Thông báo quan trọng từ ShopVPS" required style={inputStyle} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>Nội dung HTML (dùng &#123;&#123;name&#125;&#125; để cá nhân hoá)</label>
            <textarea value={html} onChange={e=>setHtml(e.target.value)} rows={10} required style={{ ...inputStyle, resize:"vertical", fontFamily:"var(--font-mono)", fontSize:12 }} onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
          </div>
          <div style={{ background:"var(--yellow-soft)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"var(--radius-md)", padding:"10px 14px", marginBottom:16, fontSize:12.5, color:"var(--yellow)" }}>
            ⚠ Email sẽ được gửi qua hàng đợi BullMQ. Kiểm tra kỹ nội dung trước khi gửi.
          </div>
          {result && (
            <div style={{ background:result.success?"var(--green-soft)":"var(--red-soft)", border:`1px solid ${result.success?"rgba(34,197,94,0.2)":"rgba(239,68,68,0.2)"}`, borderRadius:"var(--radius-md)", padding:"10px 14px", marginBottom:16, fontSize:13, color:result.success?"var(--green)":"var(--red)" }}>
              {result.success ? `&#10003; Đã thêm vào hàng đợi: ${result.data?.queued} email` : `&#10007; ${result.error}`}
            </div>
          )}
          <button type="submit" disabled={sending} style={{ padding:"11px 24px", background:sending?"rgba(79,124,255,0.4)":"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:700, cursor:sending?"not-allowed":"pointer" }}>
            {sending?"Đang gửi...":"Gửi email →"}
          </button>
        </form>
      </div>
    </div>
  );
}
