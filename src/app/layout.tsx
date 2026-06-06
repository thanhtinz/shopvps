import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppearanceProvider } from "@/components/AppearanceProvider";
import { APPEARANCE_BOOT_SCRIPT } from "@/lib/appearance";
import { LocaleProvider } from "@/components/LocaleProvider";
import { CartProvider } from "@/components/CartProvider";
import { LOCALE_BOOT_SCRIPT } from "@/lib/i18n/dictionaries";
import { getServerT } from "@/lib/i18n/server";
import { getSettings } from "@/lib/settings";
import SiteWidgets from "@/components/SiteWidgets";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerT();
  return {
    title: { default: "ShopVPS", template: "%s · ShopVPS" },
    description: t("Quản lý VPS & Hosting chuyên nghiệp"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getServerT();
  const s = await getSettings(["chat_provider", "chat_id", "cookie_consent", "cookie_text"]).catch(() => ({} as Record<string, string>));
  return (
    <html lang={locale} className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT_SCRIPT }} />
      </head>
      <body className="h-full">
        <AppearanceProvider>
          <LocaleProvider>
            <CartProvider>{children}</CartProvider>
            <SiteWidgets chatProvider={s.chat_provider} chatId={s.chat_id} cookieConsent={s.cookie_consent === "true"} cookieText={s.cookie_text} />
          </LocaleProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
