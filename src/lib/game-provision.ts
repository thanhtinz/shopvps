import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { getVpsProvider } from "@/lib/vps-providers";
import { decrypt } from "@/lib/encrypt";
import crypto from "crypto";

export interface GameVpsResult { providerVpsId: string; ip: string; password: string; }

// Deploy a real VPS that auto-installs the game via cloud-init (user_data).
// Used as the auto fallback for game-server orders when no game panel is set up.
// Returns null when the game-VPS target isn't configured (caller leaves PENDING).
export async function provisionGameVps(game: { installScript: string | null }, hostname: string): Promise<GameVpsResult | null> {
  if (!game.installScript) return null;
  const s = await getSettings(["game_vps_provider_id", "game_vps_plan", "game_vps_region", "game_vps_os"]);
  if (!s.game_vps_provider_id || !s.game_vps_plan || !s.game_vps_os) return null;

  const provider = await prisma.vpsProvider.findUnique({ where: { id: s.game_vps_provider_id } });
  if (!provider || !provider.apiKey) return null;

  const api = getVpsProvider(provider.slug, decrypt(provider.apiKey));
  const password = crypto.randomBytes(12).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16) + "A1!";
  const info = await api.createServer({
    hostname,
    planId: s.game_vps_plan,
    regionId: s.game_vps_region || "sgp",
    osId: s.game_vps_os,
    password,
    userData: game.installScript,
  });
  return { providerVpsId: info.id, ip: info.ipAddress, password };
}
