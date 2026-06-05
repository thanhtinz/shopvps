"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

type Step = 1 | 2 | 3;

interface VerifyResult {
  domain: string;
  expiresAt: string | null;
  hwFingerprint: string;
}

export default function SetupPage() {
  const { t } = useLocale();
  const [step, setStep] = useState<Step>(1);
  const [licenseKey, setLicenseKey] = useState("");
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleVerifyKey() {
    if (!licenseKey.trim()) {
      setError(t("Vui lòng nhập license key"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/setup/verify-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || t("License key không hợp lệ"));
        return;
      }
      setVerifyResult(data);
      setStep(2);
    } catch {
      setError(t("Không thể kết nối đến máy chủ"));
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!adminName || !adminEmail || !adminPassword) {
      setError(t("Vui lòng điền đầy đủ thông tin"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/setup/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey, adminName, adminEmail, adminPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || t("Đã có lỗi xảy ra"));
        return;
      }
      setStep(3);
      setTimeout(() => { window.location.href = "/dashboard"; }, 2500);
    } catch {
      setError(t("Không thể hoàn tất setup"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'DM Sans', 'Sora', system-ui, sans-serif",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)",
      }} />

      {/* Glow */}
      <div style={{
        position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
        width: 600, height: 300,
        background: "radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", width: "100%", maxWidth: 480, zIndex: 1 }}>

        {/* Logo + title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)",
            borderRadius: 12, padding: "8px 18px", marginBottom: 20,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: "#818cf8", fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>SHOPVPS</span>
          </div>
          <h1 style={{ color: "#f1f5f9", fontSize: 26, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.03em" }}>
            {t("Thiết lập hệ thống")}
          </h1>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
            {t("Cài đặt một lần duy nhất trước khi sử dụng")}
          </p>
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 32 }}>
          {[
            { n: 1, label: "License" },
            { n: 2, label: t("Tài khoản") },
            { n: 3, label: t("Hoàn tất") },
          ].map((s, i) => (
            <div key={s.n} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: step > s.n ? "#6366f1" : step === s.n ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.04)",
                  border: step >= s.n ? "1.5px solid #6366f1" : "1.5px solid rgba(255,255,255,0.1)",
                  color: step >= s.n ? (step > s.n ? "#fff" : "#818cf8") : "#475569",
                  transition: "all 0.3s",
                }}>
                  {step > s.n ? "&#10003;" : s.n}
                </div>
                <span style={{ fontSize: 11, color: step >= s.n ? "#94a3b8" : "#334155", marginTop: 4, whiteSpace: "nowrap" }}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div style={{
                  flex: 1, height: 1, margin: "0 4px",
                  background: step > s.n + 1 ? "#6366f1" : "rgba(255,255,255,0.08)",
                  marginBottom: 18, transition: "background 0.3s",
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(15,15,25,0.9)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 32,
          backdropFilter: "blur(12px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}>

          {/* STEP 1 — License Key */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <h2 style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600, margin: 0 }}>{t("Nhập License Key")}</h2>
                    <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>{t("Key được cung cấp khi bạn mua sản phẩm")}</p>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 500, marginBottom: 8, letterSpacing: "0.04em" }}>
                  LICENSE KEY
                </label>
                <input
                  value={licenseKey}
                  onChange={e => setLicenseKey(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleVerifyKey()}
                  placeholder="LIC-SVP-XXXX-YYYY-ZZZZ"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    background: "rgba(255,255,255,0.04)",
                    border: error ? "1.5px solid rgba(239,68,68,0.5)" : "1.5px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: "12px 14px",
                    color: "#e2e8f0", fontSize: 14,
                    fontFamily: "monospace", letterSpacing: "0.08em",
                    outline: "none", transition: "border 0.2s",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                  onBlur={e => e.target.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}
                />
              </div>

              {/* Domain info */}
              <div style={{
                background: "rgba(99,102,241,0.06)",
                border: "1px solid rgba(99,102,241,0.15)",
                borderRadius: 10, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 20,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="#6366f1" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ color: "#818cf8", fontSize: 12 }}>
                  {t("Domain sẽ được tự động xác nhận từ URL hiện tại")}
                </span>
              </div>

              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10, padding: "10px 14px",
                  color: "#f87171", fontSize: 13, marginBottom: 16,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>⚠</span> {error}
                </div>
              )}

              <button
                onClick={handleVerifyKey}
                disabled={loading}
                style={{
                  width: "100%", padding: "13px",
                  background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none", borderRadius: 10,
                  color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    {t("Đang xác thực...")}
                  </>
                ) : t("Xác thực License Key →")}
              </button>
            </div>
          )}

          {/* STEP 2 — Admin Account */}
          {step === 2 && verifyResult && (
            <div>
              {/* License verified badge */}
              <div style={{
                background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: 10, padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 20,
              }}>
                <span style={{ color: "#34d399", fontSize: 16 }}>&#10003;</span>
                <div>
                  <div style={{ color: "#34d399", fontSize: 12, fontWeight: 600 }}>{t("License hợp lệ")}</div>
                  <div style={{ color: "#475569", fontSize: 11 }}>
                    Domain: {verifyResult.domain}
                    {verifyResult.expiresAt && ` · ${t("Hết hạn")}: ${new Date(verifyResult.expiresAt).toLocaleDateString("vi-VN")}`}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "rgba(99,102,241,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#818cf8" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="7" r="4" stroke="#818cf8" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{ color: "#f1f5f9", fontSize: 16, fontWeight: 600, margin: 0 }}>{t("Tạo tài khoản Admin")}</h2>
                  <p style={{ color: "#475569", fontSize: 12, margin: 0 }}>{t("Tài khoản quản trị hệ thống")}</p>
                </div>
              </div>

              {[
                { label: t("Họ tên"), value: adminName, setter: setAdminName, placeholder: t("Nguyễn Văn A"), type: "text" },
                { label: "Email", value: adminEmail, setter: setAdminEmail, placeholder: "admin@yourdomain.com", type: "email" },
              ].map(field => (
                <div key={field.label} style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 500, marginBottom: 6, letterSpacing: "0.04em" }}>
                    {field.label.toUpperCase()}
                  </label>
                  <input
                    type={field.type}
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    placeholder={field.placeholder}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)",
                      border: "1.5px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, padding: "12px 14px",
                      color: "#e2e8f0", fontSize: 14, outline: "none",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: "#94a3b8", fontSize: 12, fontWeight: 500, marginBottom: 6, letterSpacing: "0.04em" }}>
                  {t("MẬT KHẨU")}
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={e => setAdminPassword(e.target.value)}
                    placeholder={t("Tối thiểu 8 ký tự")}
                    style={{
                      width: "100%", boxSizing: "border-box",
                      background: "rgba(255,255,255,0.04)",
                      border: "1.5px solid rgba(255,255,255,0.08)",
                      borderRadius: 10, padding: "12px 42px 12px 14px",
                      color: "#e2e8f0", fontSize: 14, outline: "none",
                    }}
                    onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                    onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", color: "#475569", cursor: "pointer", padding: 4,
                    }}
                  >
                    {showPassword ? "" : ""}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                  borderRadius: 10, padding: "10px 14px",
                  color: "#f87171", fontSize: 13, marginBottom: 16,
                }}>
                  ⚠ {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => { setStep(1); setError(""); }}
                  style={{
                    flex: "0 0 auto", padding: "13px 16px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1.5px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, color: "#94a3b8", fontSize: 14, cursor: "pointer",
                  }}
                >← {t("Quay lại")}</button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  style={{
                    flex: 1, padding: "13px",
                    background: loading ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    border: "none", borderRadius: 10,
                    color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? t("Đang hoàn tất...") : t("Hoàn tất Setup →")}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Done */}
          {step === 3 && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", fontSize: 32,
              }}>&#10003;</div>
              <h2 style={{ color: "#f1f5f9", fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>
                {t("Setup hoàn tất!")}
              </h2>
              <p style={{ color: "#64748b", fontSize: 14, margin: "0 0 24px" }}>
                {t("Đang chuyển đến dashboard...")}
              </p>
              <div style={{
                height: 3, background: "rgba(255,255,255,0.05)",
                borderRadius: 99, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", background: "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  borderRadius: 99, animation: "progress 2.5s linear forwards",
                }} />
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: "center", color: "#1e293b", fontSize: 12, marginTop: 20 }}>
          ShopVPS · Powered by License Platform
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { -webkit-font-smoothing: antialiased; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        input::placeholder { color: #334155; }
        input:focus { outline: none; }
        button:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        button { transition: all 0.15s; }
      `}</style>
    </div>
  );
}
