"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  OPERATIONAL:   { label: "Hoạt động bình thường", color: "#22c55e", dot: "#22c55e" },
  DEGRADED:      { label: "Hiệu suất giảm",        color: "#f59e0b", dot: "#f59e0b" },
  PARTIAL_OUTAGE:{ label: "Gián đoạn một phần",    color: "#f97316", dot: "#f97316" },
  MAJOR_OUTAGE:  { label: "Sự cố nghiêm trọng",    color: "#ef4444", dot: "#ef4444" },
  MAINTENANCE:   { label: "Đang bảo trì",          color: "#3b82f6", dot: "#3b82f6" },
};

const impactConfig: Record<string, { label: string; color: string }> = {
  NONE:     { label: "Không ảnh hưởng", color: "#22c55e" },
  MINOR:    { label: "Ảnh hưởng nhỏ",  color: "#f59e0b" },
  MAJOR:    { label: "Ảnh hưởng lớn",  color: "#f97316" },
  CRITICAL: { label: "Nghiêm trọng",   color: "#ef4444" },
};

export default function StatusPage() {
  const [data, setData] = useState<{ services: any[]; incidents: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status").then(r => r.json()).then(d => { setData(d.data); setLoading(false); });
    const interval = setInterval(() => {
      fetch("/api/status").then(r => r.json()).then(d => setData(d.data));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOperational = data?.services.every(s => s.status === "OPERATIONAL");

  return (
    <div style={{ minHeight: "100vh", background: "#080b12", fontFamily: "var(--font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)", color: "#e8edf5" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg,#4f7cff,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12H2M5 12V5a2 2 0 012-2h10a2 2 0 012 2v7M2 19h20M5 19v-4M19 19v-4" /></svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>ShopVPS</span>
        </Link>
        <span style={{ fontSize: 12, color: "#4a5568" }}>Cập nhật mỗi 30s</span>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        {/* Overall status banner */}
        <div style={{
          borderRadius: 16, padding: "24px 28px", marginBottom: 36,
          background: allOperational ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${allOperational ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
          display: "flex", alignItems: "center", gap: 16,
        }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: allOperational ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            {loading ? "" : allOperational ? "&#10003;" : "⚠"}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#e8edf5", marginBottom: 2 }}>
              {loading ? "Đang tải..." : allOperational ? "Tất cả hệ thống hoạt động bình thường" : "Một số hệ thống đang gặp sự cố"}
            </div>
            <div style={{ fontSize: 13, color: "#8896aa" }}>{new Date().toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>

        {/* Services */}
        <div style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", marginBottom: 28 }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#e8edf5" }}>Trạng thái dịch vụ</span>
          </div>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
                <div style={{ width: 180, height: 14, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
                <div style={{ width: 80, height: 14, background: "rgba(255,255,255,0.05)", borderRadius: 4 }} />
              </div>
            ))
          ) : (
            data?.services.map((svc, i) => {
              const cfg = statusConfig[svc.status] || statusConfig.OPERATIONAL;
              return (
                <div key={svc.id} style={{ padding: "14px 20px", borderBottom: i < (data.services.length - 1) ? "1px solid rgba(255,255,255,0.05)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, flexShrink: 0, boxShadow: svc.status === "OPERATIONAL" ? `0 0 6px ${cfg.dot}60` : "none" }} />
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{svc.name}</span>
                    {svc.description && <span style={{ fontSize: 12, color: "#4a5568" }}>{svc.description}</span>}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Active incidents */}
        {data?.incidents && data.incidents.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#e8edf5", marginBottom: 12 }}>Sự cố đang diễn ra</h2>
            {data.incidents.map(inc => {
              const impact = impactConfig[inc.impact] || impactConfig.MINOR;
              return (
                <div key={inc.id} style={{ background: "rgba(13,17,23,0.8)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "16px 20px", marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e8edf5", marginBottom: 2 }}>{inc.title}</div>
                      <div style={{ fontSize: 12, color: "#8896aa" }}>{inc.service?.name}</div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11.5, fontWeight: 600, background: `${impact.color}18`, color: impact.color }}>
                      {impact.label}
                    </span>
                  </div>
                  {inc.updates?.[0] && (
                    <div style={{ fontSize: 13, color: "#8896aa", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 10, marginTop: 8 }}>
                      {inc.updates[0].content}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Historical uptime note */}
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12 }}>
            {["99.9%", "< 50ms", "24/7"].map((v, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#4f7cff", letterSpacing: "-0.03em" }}>{v}</div>
                <div style={{ fontSize: 11.5, color: "#4a5568", marginTop: 2 }}>
                  {["Uptime 30 ngày", "Latency trung bình", "Monitoring"][i]}
                </div>
              </div>
            ))}
          </div>
          <Link href="/login" style={{ fontSize: 13, color: "#4f7cff", textDecoration: "none" }}>Đăng nhập vào dashboard →</Link>
        </div>
      </div>
    </div>
  );
}
