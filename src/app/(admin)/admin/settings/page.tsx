"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

const SECTIONS = [
  { title:"Website", fields:[
    { key:"app_name", label:"Tên website" },
    { key:"app_url", label:"URL website" },
  ]},
  { title:"Bảo mật (reCAPTCHA & MaxMind)", fields:[
    { key:"recaptcha_site_key", label:"reCAPTCHA v3 Site Key" },
    { key:"recaptcha_secret", label:"reCAPTCHA v3 Secret Key" },
    { key:"recaptcha_min_score", label:"Ngưỡng điểm reCAPTCHA (0-1, mặc định 0.5)" },
    { key:"maxmind_account_id", label:"MaxMind Account ID" },
    { key:"maxmind_license_key", label:"MaxMind License Key (minFraud)" },
  ]},
  { title:"Live chat & Cookie/GDPR", fields:[
    { key:"chat_provider", label:"Nhà cung cấp chat (tawk | crisp | messenger | zalo)" },
    { key:"chat_id", label:"ID chat (Tawk/Crisp widget ID, m.me hoặc zalo.me ID)" },
    { key:"cookie_consent", label:"Bật banner cookie (true/false)" },
    { key:"cookie_text", label:"Nội dung banner cookie" },
  ]},
  { title:"Email & Thông báo", fields:[
    { key:"smtp_host", label:"SMTP Host" },
    { key:"smtp_port", label:"SMTP Port" },
    { key:"smtp_user", label:"SMTP User" },
    { key:"smtp_from", label:"From Email" },
  ]},
  { title:"Affiliate", fields:[
    { key:"affiliate_rate", label:"Hoa hồng (%)" },
    { key:"affiliate_min_payout", label:"Rút tối thiểu (đ)" },
    { key:"affiliate_auto_payout", label:"Tự động rút hoa hồng (true/false)" },
    { key:"affiliate_auto_payout_threshold", label:"Ngưỡng tự động rút (đ)" },
  ]},
  { title:"Thuế (VAT)", fields:[
    { key:"tax_rate", label:"Thuế suất VAT (%) — 0 để tắt. Giá đã bao gồm VAT" },
    { key:"tax_label", label:"Tên thuế (vd: VAT)" },
    { key:"business_country", label:"Quốc gia doanh nghiệp (ISO-2, vd VN)" },
    { key:"eu_reverse_charge", label:"EU reverse charge cho B2B có VAT ID (true/false)" },
  ]},
  { title:"Game panel (Pterodactyl/Pelican)", fields:[
    { key:"panel_url", label:"URL panel (vd https://panel.example.com)" },
    { key:"panel_api_key", label:"Application API key (ptla_...)" },
    { key:"panel_client_key", label:"Client API key (ptlc_...) — cho bảng điều khiển nhúng" },
    { key:"panel_user_id", label:"Panel user ID sở hữu server" },
    { key:"panel_location_id", label:"Location ID để deploy" },
    { key:"game_vps_provider_id", label:"Game-VPS: provider ID (cloud-init fallback)" },
    { key:"game_vps_plan", label:"Game-VPS: plan/size slug" },
    { key:"game_vps_region", label:"Game-VPS: region" },
    { key:"game_vps_os", label:"Game-VPS: OS image ID" },
  ]},
  { title:"Tên miền (Registrar)", fields:[
    { key:"registrar", label:"Nhà đăng ký (namesilo / manual)" },
    { key:"registrar_api_key", label:"API key registrar" },
    { key:"registrar_sandbox", label:"Chế độ sandbox (true/false)" },
  ]},
  { title:"Danh mục bán hàng (bật/tắt)", fields:[
    { key:"sell_vps", label:"Module VPS tích hợp (true/false)" },
    { key:"sell_hosting", label:"Module Hosting tích hợp (true/false)" },
    { key:"sell_domain", label:"Module Tên miền tích hợp (true/false)" },
    { key:"sell_group_SERVER_HOSTING", label:"Nhóm Server & Hosting (true/false)" },
    { key:"sell_group_PROXY", label:"Nhóm Proxy (true/false)" },
    { key:"sell_group_SECURITY", label:"Nhóm Security (true/false)" },
    { key:"sell_group_DOMAIN", label:"Nhóm Tên miền (catalog) (true/false)" },
    { key:"sell_group_DATABASE_STORAGE", label:"Nhóm Database & Storage (true/false)" },
    { key:"sell_group_DEVELOPER", label:"Nhóm Developer Services (true/false)" },
    { key:"sell_group_AUTOMATION", label:"Nhóm Automation (true/false)" },
    { key:"sell_group_AI", label:"Nhóm AI Services (true/false)" },
    { key:"sell_group_MARKETING", label:"Nhóm MMO & Marketing (true/false)" },
    { key:"sell_group_LICENSE", label:"Nhóm License Services (true/false)" },
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
