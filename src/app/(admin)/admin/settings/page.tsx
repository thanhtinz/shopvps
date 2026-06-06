"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

const SECTIONS = [
  { title:"Website", fields:[
    { key:"app_name", label:"Tên website" },
    { key:"app_url", label:"URL website" },
  ]},
  { title:"Email & Thông báo", fields:[
    { key:"smtp_host", label:"SMTP Host" },
    { key:"smtp_port", label:"SMTP Port" },
    { key:"smtp_user", label:"SMTP User" },
    { key:"smtp_from", label:"From Email" },
  ]},
  { title:"Affiliate", fields:[
    { key:"affiliate_rate", label:"Hoa hồng (%)" },
  ]},
  { title:"Thuế (VAT)", fields:[
    { key:"tax_rate", label:"Thuế suất VAT (%) — 0 để tắt. Giá đã bao gồm VAT" },
    { key:"tax_label", label:"Tên thuế (vd: VAT)" },
  ]},
  { title:"Tên miền (Registrar)", fields:[
    { key:"registrar", label:"Nhà đăng ký (namesilo / manual)" },
    { key:"registrar_api_key", label:"API key registrar" },
    { key:"registrar_sandbox", label:"Chế độ sandbox (true/false)" },
  ]},
  { title:"Billing tự động", fields:[
    { key:"billing_invoice_lead_days", label:"Tạo hoá đơn trước hạn (số ngày, mặc định 7)" },
    { key:"billing_auto_pay", label:"Tự động trừ ví để gia hạn (true/false, mặc định true)" },
    { key:"billing_suspend_grace_days", label:"Tạm dừng sau khi quá hạn (số ngày, mặc định 3)" },
    { key:"billing_terminate_days", label:"Huỷ dịch vụ sau khi quá hạn (số ngày, mặc định 15)" },
  ]},
  { title:"Hệ thống", fields:[
    { key:"maintenance_mode", label:"Chế độ bảo trì (true/false)" },
    { key:"demo_mode", label:"Chế độ Demo (true/false)" },
    { key:"recaptcha_enabled", label:"reCAPTCHA (true/false)" },
  ]},
];

export default function AdminSettingsPage() {
  const { t } = useLocale();
  const [settings, setSettings] = useState<Record<string,string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings").then(r=>r.json()).then(d=>{ setSettings(d.data||{}); setLoading(false); });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/admin/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(settings) });
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 3000);
  }

  if (loading) return <div className="skeleton" style={{ height:400, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div style={{ maxWidth:700 }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:24 }}>{t("Cài đặt hệ thống")}</h1>
      <form onSubmit={save}>
        {SECTIONS.map(section=>(
          <div key={section.title} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px", marginBottom:16 }}>
            <h3 style={{ fontSize:13.5, fontWeight:700, color:"var(--text-primary)", marginBottom:16, paddingBottom:10, borderBottom:"1px solid var(--border)" }}>{t(section.title)}</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {section.fields.map(f=>(
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{t(f.label)}</label>
                  <input value={settings[f.key]||""} onChange={e=>setSettings(p=>({...p,[f.key]:e.target.value}))} style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              ))}
            </div>
          </div>
        ))}
        {saved && <div style={{ background:"var(--green-soft)", border:"1px solid rgba(34,197,94,0.2)", borderRadius:"var(--radius-md)", padding:"10px 14px", color:"var(--green)", fontSize:13, marginBottom:14 }}>&#10003; {t("Đã lưu cài đặt!")}</div>}
        <button type="submit" disabled={saving} style={{ padding:"11px 24px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontSize:13, fontWeight:700, cursor:"pointer" }}>
          {saving?t("Đang lưu..."):t("Lưu cài đặt →")}
        </button>
      </form>
    </div>
  );
}
