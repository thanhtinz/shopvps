import { prisma } from "@/lib/prisma";

// Seed catalogue for the approved games + sensible default modules. eggId is the
// Pterodactyl egg id the admin should map to their panel (left blank by default).
export interface GameSeed { name: string; slug: string; icon: string; minRam: number; description: string }

export const GAME_SEEDS: GameSeed[] = [
  { name: "Minecraft Java", slug: "minecraft-java", icon: "", minRam: 2048, description: "Paper / Forge / Fabric, plugin & modpack" },
  { name: "Minecraft Bedrock", slug: "minecraft-bedrock", icon: "", minRam: 1024, description: "Bedrock Dedicated Server" },
  { name: "Counter-Strike 2", slug: "cs2", icon: "", minRam: 2048, description: "CS2 dedicated server" },
  { name: "Rust", slug: "rust", icon: "", minRam: 4096, description: "Rust dedicated + Oxide/uMod" },
  { name: "ARK: Survival", slug: "ark", icon: "", minRam: 6144, description: "ARK survival server" },
  { name: "Valheim", slug: "valheim", icon: "", minRam: 2048, description: "Valheim dedicated server" },
  { name: "FiveM (GTA RP)", slug: "fivem", icon: "", minRam: 4096, description: "FiveM / txAdmin resource server" },
  { name: "Palworld", slug: "palworld", icon: "", minRam: 8192, description: "Palworld dedicated server" },
  { name: "Terraria", slug: "terraria", icon: "", minRam: 1024, description: "Terraria / TShock server" },
];

// Global modules offered for every game.
export const GLOBAL_MODULE_SEEDS = [
  { name: "Auto Backup", slug: "auto-backup", description: "Sao lưu tự động định kỳ", priceMonthly: 0 },
  { name: "Scheduled Restart", slug: "scheduled-restart", description: "Tự khởi động lại theo lịch", priceMonthly: 0 },
  { name: "DDoS Protection", slug: "ddos-protection", description: "Lọc tấn công cho game", priceMonthly: 0 },
  { name: "Web Console (RCON)", slug: "web-console", description: "Bảng điều khiển web + RCON", priceMonthly: 0 },
  { name: "Sub-domain + SRV", slug: "subdomain-srv", description: "Tên miền phụ + bản ghi SRV", priceMonthly: 0 },
  { name: "Mod/Plugin Manager", slug: "mod-manager", description: "Cài/gỡ mod & plugin 1-click", priceMonthly: 0 },
];

export async function getActiveGames() {
  return prisma.game.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { modules: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } } });
}

/** Active modules available for a game (its own + global). */
export async function modulesForGame(gameId: string) {
  return prisma.gameModule.findMany({ where: { isActive: true, OR: [{ gameId }, { gameId: null }] }, orderBy: { sortOrder: "asc" } });
}

/** Idempotently seed the games + global modules (safe to run repeatedly). */
export async function seedGames(): Promise<{ games: number; modules: number }> {
  let games = 0, modules = 0;
  for (let i = 0; i < GAME_SEEDS.length; i++) {
    const g = GAME_SEEDS[i];
    const existing = await prisma.game.findUnique({ where: { slug: g.slug } });
    if (!existing) { await prisma.game.create({ data: { name: g.name, slug: g.slug, icon: g.icon, minRam: g.minRam, description: g.description, sortOrder: i } }); games++; }
  }
  for (let i = 0; i < GLOBAL_MODULE_SEEDS.length; i++) {
    const m = GLOBAL_MODULE_SEEDS[i];
    const ex = await prisma.gameModule.findFirst({ where: { gameId: null, slug: m.slug } });
    if (!ex) { await prisma.gameModule.create({ data: { gameId: null, name: m.name, slug: m.slug, description: m.description, priceMonthly: m.priceMonthly, sortOrder: i } }); modules++; }
  }
  return { games, modules };
}
