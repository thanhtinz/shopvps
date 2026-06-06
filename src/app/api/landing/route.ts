import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// Public data for the marketing landing page: branding, editable marketing
// stats (with sensible defaults), and real catalogue sizes.
export async function GET() {
  const s = await getSettings([
    "app_name", "app_tagline", "stat_uptime", "stat_customers", "stat_servers", "stat_datacenters",
    "contact_email", "contact_phone", "contact_zalo", "contact_discord", "contact_address",
  ]);
  const [games, providers, tlds] = await Promise.all([
    prisma.game.count({ where: { isActive: true } }).catch(() => 0),
    prisma.vpsProvider.count({ where: { isActive: true } }).catch(() => 0),
    prisma.tld.count({ where: { isActive: true } }).catch(() => 0),
  ]);
  return NextResponse.json({
    success: true,
    data: {
      appName: s.app_name || "ShopVPS",
      tagline: s.app_tagline || "",
      stats: {
        uptime: s.stat_uptime || "99.9%",
        customers: s.stat_customers || "1,000+",
        servers: s.stat_servers || "50+",
        datacenters: s.stat_datacenters || "5+",
      },
      counts: { games, providers, tlds },
      contact: {
        email: s.contact_email || "", phone: s.contact_phone || "",
        zalo: s.contact_zalo || "", discord: s.contact_discord || "", address: s.contact_address || "",
      },
    },
  });
}
