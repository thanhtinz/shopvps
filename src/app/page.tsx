import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import Landing from "@/components/Landing";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings(["app_name", "app_tagline", "app_url"]).catch(() => ({} as Record<string, string>));
  const name = s.app_name || "ShopVPS";
  const desc = s.app_tagline || "VPS, Hosting, Tên miền, SSL & Game hosting — quản lý toàn bộ hạ tầng từ một nơi, thanh toán tự động cho thị trường Việt Nam.";
  return {
    title: `${name} — VPS, Hosting, Domain & SSL`,
    description: desc,
    openGraph: { title: name, description: desc, type: "website", url: s.app_url || undefined },
    twitter: { card: "summary_large_image", title: name, description: desc },
  };
}

export default function Page() {
  return <Landing />;
}
