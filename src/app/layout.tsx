import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppearanceProvider } from "@/components/AppearanceProvider";
import { APPEARANCE_BOOT_SCRIPT } from "@/lib/appearance";

export const metadata: Metadata = {
  title: { default: "ShopVPS", template: "%s · ShopVPS" },
  description: "Quản lý VPS & Hosting chuyên nghiệp",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
      <body className="h-full">
        <AppearanceProvider>{children}</AppearanceProvider>
      </body>
    </html>
  );
}
