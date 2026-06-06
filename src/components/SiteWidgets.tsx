"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";

// Site-wide live-chat widget + cookie/GDPR consent banner, both driven by admin
// settings. Replaces the need for separate WHMCS chat/consent addons.
export default function SiteWidgets({ chatProvider, chatId, cookieConsent, cookieText }: {
  chatProvider?: string; chatId?: string; cookieConsent?: boolean; cookieText?: string;
}) {
  const { t } = useLocale();
  const [showCookie, setShowCookie] = useState(false);

  // Inject the third-party chat script once (tawk.to / crisp).
  useEffect(() => {
    if (!chatId) return;
    if (chatProvider === "tawk" && !document.getElementById("tawk-script")) {
      const s = document.createElement("script");
      s.id = "tawk-script"; s.async = true; s.src = `https://embed.tawk.to/${chatId}/default`;
      s.charset = "UTF-8"; s.setAttribute("crossorigin", "*");
      document.body.appendChild(s);
    } else if (chatProvider === "crisp" && !document.getElementById("crisp-script")) {
      (window as any).$crisp = []; (window as any).CRISP_WEBSITE_ID = chatId;
      const s = document.createElement("script");
      s.id = "crisp-script"; s.async = true; s.src = "https://client.crisp.chat/l.js";
      document.body.appendChild(s);
    }
  }, [chatProvider, chatId]);

  useEffect(() => {
    if (cookieConsent) { try { setShowCookie(localStorage.getItem("cookie_consent") !== "1"); } catch {} }
  }, [cookieConsent]);

  function acceptCookies() { try { localStorage.setItem("cookie_consent", "1"); } catch {} setShowCookie(false); }

  // Simple floating button for link-based providers (Messenger / Zalo).
  const linkBtn = chatId && (chatProvider === "messenger" || chatProvider === "zalo");
  const href = chatProvider === "messenger" ? `https://m.me/${chatId}` : `https://zalo.me/${chatId}`;

  return (
    <>
      {linkBtn && (
        <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat"
          style={{ position: "fixed", right: 20, bottom: 20, width: 56, height: 56, borderRadius: "50%", background: chatProvider === "zalo" ? "#0068ff" : "#0084ff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 20px rgba(0,0,0,0.3)", zIndex: 60, textDecoration: "none" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.5 2 2 5.8 2 10.5c0 2.4 1.2 4.6 3.1 6.1-.1 1.1-.6 2.6-1.4 3.9 1.6-.2 3.3-.9 4.5-1.7 1.2.4 2.5.6 3.8.6 5.5 0 10-3.8 10-8.9S17.5 2 12 2z" /></svg>
        </a>
      )}

      {showCookie && (
        <div style={{ position: "fixed", left: 16, right: 16, bottom: 16, maxWidth: 560, margin: "0 auto", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", padding: "16px 18px", boxShadow: "0 10px 40px rgba(0,0,0,0.35)", zIndex: 70, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ flex: 1, minWidth: 220, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {cookieText || t("Chúng tôi dùng cookie để cải thiện trải nghiệm. Tiếp tục nghĩa là bạn đồng ý.")}
          </span>
          <button onClick={acceptCookies} style={{ padding: "9px 18px", background: "var(--accent)", border: "none", borderRadius: "var(--radius-md)", color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>{t("Đồng ý")}</button>
        </div>
      )}
    </>
  );
}
