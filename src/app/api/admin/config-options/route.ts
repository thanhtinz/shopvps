import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const options = await prisma.configOption.findMany({ orderBy: { sortOrder: "asc" }, include: { choices: { orderBy: { sortOrder: "asc" } } } });
  const [products, vpsPackages, hostingPackages] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.vpsPackage.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.hostingPackage.findMany({ where: { isActive: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  return NextResponse.json({ success: true, data: { options, products, vpsPackages, hostingPackages } });
}

const SCOPES = ["product", "vps", "hosting", "global"];

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  // Honour an explicit scope; "global" ignores refId, other scopes may target a
  // specific item (refId) or all items in the scope (null).
  const scope = SCOPES.includes(b.scope) ? b.scope : (b.refId ? "product" : "global");
  const opt = await prisma.configOption.create({
    data: {
      name: String(b.name), description: b.description || null,
      type: b.type === "checkbox" ? "checkbox" : "select",
      scope, refId: scope === "global" ? null : (b.refId || null),
      required: !!b.required, isActive: b.isActive !== false, sortOrder: parseInt(b.sortOrder, 10) || 0,
    },
  });
  return NextResponse.json({ success: true, data: opt });
}
