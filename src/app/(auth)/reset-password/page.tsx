"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import WarnIcon from "@/components/ui/WarnIcon";

function ResetForm() {
  const { t } = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError("");
    if (password !== confirm) { setError(t("Mật khẩu không khớp")); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await res.json();
    if (data.success) { setDone(true); setTimeout(() => router.push("/login"), 2500); }
    else { setError(data.error); setLoading(false); }
  }

  const inputStyle = { width: "100%", boxSizing: "border-box" as const, background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "11px 14px", color: "#e8edf5", fontSize: 14, outline: "none", fontFamily: "inherit" };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 18, textDecoration: "none", color: "#8896aa", fontSize: 13 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          {t("Quay lại đăng nhập")}
        </Link>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#e8edf5", letterSpacing: "-0.03em", marginBottom: 4 }}>{t("Đặt lại mật khẩu")}</h1>
      </div>
      <div style={{ background: "rgba(13,17,23,0.95)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ marginBottom:12, display:"flex", justifyContent:"center" }}><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"/></svg></div>
            <p style={{ color: "#8896aa", fontSize: 13 }}>{t("Mật khẩu đã được đặt lại. Đang chuyển đến trang đăng nhập...")}</p>
          </div>
        ) : (
          <form onSubmit={submit}>
            {[
              { label: t("Mật khẩu mới"), val: password, set: setPassword },
              { label: t("Xác nhận mật khẩu"), val: confirm, set: setConfirm },
            ].map(f => (
              <div key={f.label} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4a5568", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>{f.label}</label>
                <input type="password" value={f.val} onChange={e => f.set(e.target.value)} required style={inputStyle} onFocus={e => e.target.style.borderColor = "rgba(79,124,255,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"} />
              </div>
            ))}
            {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "10px 12px", color: "#ef4444", fontSize: 13, marginBottom: 14 }}><WarnIcon /> {error}</div>}
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: loading ? "rgba(79,124,255,0.4)" : "#4f7cff", border: "none", borderRadius: 10, color: "white", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? t("Đang đặt lại...") : t("Đặt lại mật khẩu →")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetForm /></Suspense>;
}
