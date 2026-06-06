"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";

const inputStyle = { width:"100%", boxSizing:"border-box" as const, background:"var(--bg-elevated)", border:"1.5px solid var(--border)", borderRadius:"var(--radius-md)", padding:"9px 12px", color:"var(--text-primary)", fontSize:13, outline:"none", fontFamily:"inherit" };

type Section = {
  title: string;
  help?: string;
  docs?: { label: string; url: string }[];
  links?: { label: string; path: string }[]; // webhook/callback URLs (built from site origin)
  test?: { label: string; endpoint: string };
  fields: { key: string; label: string }[];
};

const SECTIONS: Section[] = [
  { title:"Website", help:"Tên, slogan và URL hiển thị toàn site, dùng trong email, hoá đơn và landing page.", fields:[
    { key:"app_name", label:"Tên website" },
    { key:"app_tagline", label:"Slogan (hiện ở landing)" },
    { key:"app_url", label:"URL website (vd https://shop.example.com)" },
  ]},
  { title:"Landing — Thống kê & Liên hệ", help:"Các con số marketing hiển thị trên trang chủ và thông tin liên hệ ở footer/trang Liên hệ.", fields:[
    { key:"stat_uptime", label:"Uptime (vd 99.9%)" },
    { key:"stat_customers", label:"Số khách hàng (vd 1,000+)" },
    { key:"stat_servers", label:"Số server (vd 50+)" },
    { key:"stat_datacenters", label:"Số data center (vd 5+)" },
    { key:"contact_email", label:"Email liên hệ" },
    { key:"contact_phone", label:"Số điện thoại" },
    { key:"contact_zalo", label:"Link/ID Zalo" },
    { key:"contact_discord", label:"Link Discord" },
    { key:"contact_address", label:"Địa chỉ" },
  ]},
  { title:"Bảo mật (reCAPTCHA & MaxMind)",
    help:"Chống bot khi đăng ký và chấm điểm gian lận. Để trống = tắt (không chặn ai).",
    docs:[
      { label:"Tạo khoá reCAPTCHA v3", url:"https://www.google.com/recaptcha/admin/create" },
      { label:"MaxMind minFraud", url:"https://www.maxmind.com/en/solutions/minfraud-services" },
    ],
    fields:[
    { key:"recaptcha_site_key", label:"reCAPTCHA v3 Site Key" },
    { key:"recaptcha_secret", label:"reCAPTCHA v3 Secret Key" },
    { key:"recaptcha_min_score", label:"Ngưỡng điểm reCAPTCHA (0-1, mặc định 0.5)" },
    { key:"maxmind_account_id", label:"MaxMind Account ID" },
    { key:"maxmind_license_key", label:"MaxMind License Key (minFraud)" },
  ]},
  { title:"SSL tự động (Let's Encrypt / ACME)",
    help:"Cấp SSL miễn phí tự động qua DNS-01 (cần Registrar quản lý DNS của domain). Hãy test staging trước khi bật production để tránh rate-limit. Cần chạy npm install acme-client ở môi trường thật.",
    docs:[
      { label:"Let's Encrypt", url:"https://letsencrypt.org/docs/" },
      { label:"Directory staging (dán vào ô bên dưới để test)", url:"https://acme-staging-v02.api.letsencrypt.org/directory" },
    ],
    test:{ label:"Test ACME (staging)", endpoint:"/api/admin/ssl/acme-test" },
    fields:[
    { key:"acme_enabled", label:"Bật cấp SSL tự động (true/false)" },
    { key:"acme_email", label:"Email ACME (đăng ký Let's Encrypt)" },
    { key:"acme_directory", label:"ACME directory URL (trống = LE production)" },
  ]},
  { title:"Cổng thanh toán — Webhook & Callback",
    help:"Dán các URL dưới đây vào trang quản trị của cổng thanh toán tương ứng để nhận thông báo giao dịch. Cấu hình khoá API từng cổng tại trang Cổng thanh toán.",
    links:[
      { label:"SePay Webhook (chuyển khoản NH)", path:"/api/webhook/sepay" },
      { label:"Stripe Webhook", path:"/api/webhook/stripe" },
      { label:"PayPal Capture/Return", path:"/api/payments/paypal/capture" },
    ],
    docs:[
      { label:"Cấu hình cổng & khoá API", url:"/admin/payment-gateways" },
      { label:"Stripe Webhooks", url:"https://dashboard.stripe.com/webhooks" },
      { label:"SePay Webhooks", url:"https://my.sepay.vn/" },
    ],
    fields:[] },
  { title:"Live chat & Cookie/GDPR",
    help:"Hiện widget chat toàn site + banner đồng ý cookie. provider: tawk/crisp dùng script, messenger/zalo hiện nút nổi.",
    docs:[
      { label:"Tawk.to", url:"https://dashboard.tawk.to/" },
      { label:"Crisp", url:"https://app.crisp.chat/" },
    ],
    fields:[
    { key:"chat_provider", label:"Nhà cung cấp chat (tawk | crisp | messenger | zalo)" },
    { key:"chat_id", label:"ID chat (Tawk/Crisp widget ID, m.me hoặc zalo.me ID)" },
    { key:"cookie_consent", label:"Bật banner cookie (true/false)" },
    { key:"cookie_text", label:"Nội dung banner cookie" },
  ]},
  { title:"Email & Thông báo",
    help:"SMTP để gửi email giao dịch (xác thực, hoá đơn, nhắc hạn). Mật khẩu SMTP đặt qua biến môi trường SMTP_PASS.",
    fields:[
    { key:"smtp_host", label:"SMTP Host" },
    { key:"smtp_port", label:"SMTP Port" },
    { key:"smtp_user", label:"SMTP User" },
    { key:"smtp_from", label:"From Email" },
  ]},
  { title:"Affiliate", help:"Tỷ lệ hoa hồng giới thiệu và cấu hình tự động chi trả.", fields:[
    { key:"affiliate_rate", label:"Hoa hồng (%)" },
    { key:"affiliate_min_payout", label:"Rút tối thiểu (đ)" },
    { key:"affiliate_auto_payout", label:"Tự động rút hoa hồng (true/false)" },
    { key:"affiliate_auto_payout_threshold", label:"Ngưỡng tự động rút (đ)" },
  ]},
  { title:"Thuế (VAT)", help:"Thuế suất áp vào hoá đơn. Giá niêm yết đã bao gồm VAT. Quy tắc theo quốc gia đặt tại trang Quy tắc thuế.", fields:[
    { key:"tax_rate", label:"Thuế suất VAT (%) — 0 để tắt. Giá đã bao gồm VAT" },
    { key:"tax_label", label:"Tên thuế (vd: VAT)" },
    { key:"business_country", label:"Quốc gia doanh nghiệp (ISO-2, vd VN)" },
    { key:"eu_reverse_charge", label:"EU reverse charge cho B2B có VAT ID (true/false)" },
  ]},
  { title:"Game panel (Pterodactyl/Pelican)",
    help:"Tự cấp game server qua panel. Tạo Application key (ptla_) trong Admin panel, Client key (ptlc_) trong tài khoản sở hữu server. Cho phép Origin = URL website để console websocket hoạt động.",
    docs:[ { label:"Pterodactyl API docs", url:"https://dashflo.net/docs/api/pterodactyl/v1/" } ],
    fields:[
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
  { title:"Tên miền (Registrar)",
    help:"Đăng ký/gia hạn/transfer + DNS qua registrar. Lấy API key từ trang quản trị registrar. Bật sandbox để thử nghiệm.",
    docs:[ { label:"NameSilo API Manager", url:"https://www.namesilo.com/account/api-manager" } ],
    fields:[
    { key:"registrar", label:"Nhà đăng ký (namesilo / manual)" },
    { key:"registrar_api_key", label:"API key registrar" },
    { key:"registrar_sandbox", label:"Chế độ sandbox (true/false)" },
  ]},
  { title:"Danh mục bán hàng (bật/tắt)", help:"Bật/tắt từng module và nhóm sản phẩm hiển thị trong cửa hàng.", fields:[
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
  { title:"Billing tự động", help:"Vòng đời gia hạn: tạo hoá đơn trước hạn, tự trừ ví, tạm dừng rồi huỷ khi quá hạn.", fields:[
    { key:"billing_invoice_lead_days", label:"Tạo hoá đơn trước hạn (số ngày, mặc định 7)" },
    { key:"billing_auto_pay", label:"Tự động trừ ví để gia hạn (true/false, mặc định true)" },
    { key:"billing_suspend_grace_days", label:"Tạm dừng sau khi quá hạn (số ngày, mặc định 3)" },
    { key:"billing_terminate_days", label:"Huỷ dịch vụ sau khi quá hạn (số ngày, mặc định 15)" },
  ]},
  { title:"Hệ thống", help:"Chế độ bảo trì chặn truy cập tạm thời; Demo ẩn thao tác nhạy cảm.", fields:[
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
  const [copied, setCopied] = useState<string>("");
  const [testing, setTesting] = useState<string>("");
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});

  useEffect(() => {
    fetch("/api/admin/settings").then(r=>r.json()).then(d=>{ setSettings(d.data||{}); setLoading(false); });
  }, []);

  const origin = (settings.app_url || (typeof window !== "undefined" ? window.location.origin : "")).replace(/\/$/, "");
  function copy(text: string, id: string) { navigator.clipboard?.writeText(text); setCopied(id); setTimeout(()=>setCopied(""), 1500); }
  function isExternal(url: string) { return /^https?:\/\//.test(url); }

  async function runTest(s: Section) {
    if (!s.test) return;
    setTesting(s.title); setTestResult(p=>({ ...p, [s.title]: undefined as any }));
    try {
      const res = await fetch(s.test.endpoint, { method:"POST" });
      const d = await res.json().catch(()=>({}));
      setTestResult(p=>({ ...p, [s.title]: { ok: res.ok && d.success, msg: d.message || d.error || (res.ok ? "OK" : t("Lỗi")) } }));
    } catch { setTestResult(p=>({ ...p, [s.title]: { ok:false, msg:t("Không thể kết nối") } })); }
    setTesting("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    await fetch("/api/admin/settings", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(settings) });
    setSaving(false); setSaved(true); setTimeout(()=>setSaved(false), 3000);
  }

  if (loading) return <div className="skeleton" style={{ height:400, borderRadius:"var(--radius-lg)" }}/>;

  return (
    <div style={{ maxWidth:720 }}>
      <h1 style={{ fontSize:20, fontWeight:800, color:"var(--text-primary)", letterSpacing:"-0.03em", marginBottom:24 }}>{t("Cài đặt hệ thống")}</h1>
      <form onSubmit={save}>
        {SECTIONS.map(section=>(
          <div key={section.title} style={{ background:"var(--bg-surface)", border:"1px solid var(--border)", borderRadius:"var(--radius-lg)", padding:"20px", marginBottom:16 }}>
            <h3 style={{ fontSize:13.5, fontWeight:700, color:"var(--text-primary)", marginBottom:section.help?8:16, paddingBottom:10, borderBottom:"1px solid var(--border)" }}>{t(section.title)}</h3>

            {section.help && <p style={{ fontSize:12.5, color:"var(--text-muted)", lineHeight:1.55, margin:"0 0 12px" }}>{t(section.help)}</p>}

            {section.docs && section.docs.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:14 }}>
                {section.docs.map(d=>(
                  <a key={d.url} href={isExternal(d.url)?d.url:d.url} target={isExternal(d.url)?"_blank":undefined} rel="noopener noreferrer"
                    style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, color:"var(--accent)", textDecoration:"none", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:99, padding:"4px 11px" }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6 M15 3h6v6 M10 14L21 3"/></svg>
                    {t(d.label)}
                  </a>
                ))}
              </div>
            )}

            {section.links && section.links.length > 0 && (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                {section.links.map(l=>{
                  const url = `${origin}${l.path}`;
                  return (
                    <div key={l.path}>
                      <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>{t(l.label)}</div>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <code style={{ flex:1, fontSize:12, color:"var(--text-secondary)", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-md)", padding:"8px 10px", overflowX:"auto", whiteSpace:"nowrap" }}>{url}</code>
                        <button type="button" onClick={()=>copy(url, l.path)} style={{ padding:"8px 12px", borderRadius:"var(--radius-md)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:copied===l.path?"var(--green)":"var(--accent)", fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>{copied===l.path?t("Đã sao chép"):t("Sao chép")}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {section.fields.map(f=>(
                <div key={f.key}>
                  <label style={{ display:"block", fontSize:11, fontWeight:700, color:"var(--text-muted)", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:5 }}>{t(f.label)}</label>
                  <input value={settings[f.key]||""} onChange={e=>setSettings(p=>({...p,[f.key]:e.target.value}))} style={inputStyle}
                    onFocus={e=>e.target.style.borderColor="rgba(79,124,255,0.5)"} onBlur={e=>e.target.style.borderColor="var(--border)"}/>
                </div>
              ))}
            </div>

            {section.test && (
              <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                <button type="button" onClick={()=>runTest(section)} disabled={testing===section.title} style={{ padding:"8px 16px", borderRadius:"var(--radius-md)", border:"1px solid var(--border)", background:"var(--bg-elevated)", color:"var(--text-primary)", fontSize:12.5, fontWeight:600, cursor:"pointer" }}>{testing===section.title?t("Đang test..."):t(section.test.label)}</button>
                {testResult[section.title] && <span style={{ fontSize:12.5, color:testResult[section.title].ok?"var(--green)":"var(--red)" }}>{testResult[section.title].ok?"✓ ":"✗ "}{testResult[section.title].msg}</span>}
              </div>
            )}
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
