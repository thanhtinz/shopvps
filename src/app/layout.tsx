import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "ShopVPS", template: "%s · ShopVPS" },
  description: "Quản lý VPS & Hosting chuyên nghiệp",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
