import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppearanceProvider } from "@/components/AppearanceProvider";
import { APPEARANCE_BOOT_SCRIPT } from "@/lib/appearance";
import { LocaleProvider } from "@/components/LocaleProvider";
import { CartProvider } from "@/components/CartProvider";
import { LOCALE_BOOT_SCRIPT } from "@/lib/i18n/dictionaries";
import { getServerT } from "@/lib/i18n/server";

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
          </LocaleProvider>
        </AppearanceProvider>
      </body>
    </html>
  );
}
