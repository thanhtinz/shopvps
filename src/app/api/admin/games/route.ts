import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedGames } from "@/lib/games";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const games = await prisma.game.findMany({ orderBy: { sortOrder: "asc" }, include: { modules: { orderBy: { sortOrder: "asc" } } } });
  const globalModules = await prisma.gameModule.findMany({ where: { gameId: null }, orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ success: true, data: { games, globalModules } });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (b.action === "seed") { const r = await seedGames(); return NextResponse.json({ success: true, data: r }); }
  if (!b.name) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  const game = await prisma.game.create({
    data: {
      name: String(b.name), slug: slugify(b.slug || b.name), icon: b.icon || null, description: b.description || null,
      eggId: b.eggId || null, dockerImage: b.dockerImage || null, installScript: b.installScript || null, minRam: parseInt(b.minRam, 10) || 1024,
      isActive: b.isActive !== false, sortOrder: parseInt(b.sortOrder, 10) || 0,
    },
  });
  return NextResponse.json({ success: true, data: game });
}
