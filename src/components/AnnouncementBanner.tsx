"use client";
import { useState, useEffect } from "react";
import { useLocale } from "@/components/LocaleProvider";

const colors: Record<string, { bg: string; border: string; fg: string }> = {
  info:    { bg: "rgba(79,124,255,0.1)",  border: "rgba(79,124,255,0.3)",  fg: "var(--accent)" },
  success: { bg: "var(--green-soft)",     border: "rgba(34,197,94,0.3)",   fg: "var(--green)" },
  warning: { bg: "rgba(234,179,8,0.1)",   border: "rgba(234,179,8,0.3)",   fg: "var(--yellow)" },
  danger:  { bg: "var(--red-soft)",       border: "rgba(239,68,68,0.3)",   fg: "var(--red)" },
};

const DISMISS_KEY = "dismissed_announcements";
function getDismissed(): string[] { try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]"); } catch { return []; } }
function addDismissed(id: string) { try { localStorage.setItem(DISMISS_KEY, JSON.stringify([...getDismissed(), id])); } catch {} }

export default function AnnouncementBanner() {
  const { t } = useLocale();
  const [items, setItems] = useState<any[]>([]);
  const [popup, setPopup] = useState<any>(null);

  useEffect(() => {
    fetch("/api/announcements").then(r=>r.json()).then(d=>{
      const all: any[] = d.data || [];
      const dismissed = getDismissed();
      setItems(all.filter(a => !dismissed.includes(a.id)));
      const pop = all.find(a => a.isPopup && !dismissed.includes(a.id));
      if (pop) setPopup(pop);
    }).catch(()=>{});
  }, []);

  function dismiss(id: string) {
    addDismissed(id);
    setItems(prev => prev.filter(a => a.id !== id));
    if (popup?.id === id) setPopup(null);
  }

  const banners = items.filter(a => !a.isPopup);
  if (banners.length === 0 && !popup) return null;

  return (
    <>
      {banners.length > 0 && (
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:22 }}>
          {banners.map(a => {
            const c = colors[a.type] || colors.info;
            return (
              <div key={a.id} style={{ display:"flex", alignItems:"flex-start", gap:12, background:c.bg, border:`1px solid ${c.border}`, borderRadius:"var(--radius-lg)", padding:"13px 16px" }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:c.fg, marginTop:6, flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13.5, fontWeight:700, color:"var(--text-primary)", marginBottom:2 }}>{a.title}</div>
                  <div style={{ fontSize:12.5, color:"var(--text-secondary)", lineHeight:1.5, whiteSpace:"pre-wrap" }}>{a.content}</div>
                </div>
                <button onClick={()=>dismiss(a.id)} title={t("Đã đọc")} style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", padding:2, flexShrink:0 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {popup && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:60 }} onClick={()=>dismiss(popup.id)}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"var(--radius-xl)", padding:"28px", width:460, maxWidth:"92vw" }} onClick={e=>e.stopPropagation()}>
            <div style={{ width:42, height:42, borderRadius:"50%", background:(colors[popup.type]||colors.info).bg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
              <span style={{ width:12, height:12, borderRadius:"50%", background:(colors[popup.type]||colors.info).fg }}/>
            </div>
            <h3 style={{ fontSize:17, fontWeight:800, color:"var(--text-primary)", marginBottom:10, letterSpacing:"-0.02em" }}>{popup.title}</h3>
            <div style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.65, whiteSpace:"pre-wrap", marginBottom:22 }}>{popup.content}</div>
            <button onClick={()=>dismiss(popup.id)} style={{ width:"100%", padding:"11px", background:"var(--accent)", border:"none", borderRadius:"var(--radius-md)", color:"white", fontWeight:600, fontSize:13.5, cursor:"pointer" }}>{t("Đã hiểu")}</button>
          </div>
        </div>
      )}
    </>
  );
}
