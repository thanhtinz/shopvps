import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// POST adds a module to a game ("global" id = null). DELETE removes by ?moduleId=
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  const m = await prisma.gameModule.create({
    data: {
      gameId: id === "global" ? null : id, name: String(b.name), slug: slugify(b.slug || b.name),
      description: b.description || null, priceMonthly: Number(b.priceMonthly) || 0,
      isActive: b.isActive !== false, sortOrder: parseInt(b.sortOrder, 10) || 0,
    },
  });
  return NextResponse.json({ success: true, data: m });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const moduleId = new URL(req.url).searchParams.get("moduleId");
  if (moduleId) await prisma.gameModule.delete({ where: { id: moduleId } });
  return NextResponse.json({ success: true });
}
