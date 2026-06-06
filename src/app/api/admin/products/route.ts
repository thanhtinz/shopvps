import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isProductCategory } from "@/lib/products";
import { getServerT } from "@/lib/i18n/server";

async function isAdmin(s: any) { return s && ["ADMIN","SUPER_ADMIN"].includes((s.user as any).role); }

export async function GET() {
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const products = await prisma.product.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json({ success: true, data: products });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!await isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const category = String(b.category || "").toUpperCase();
  if (!isProductCategory(category) || !b.name || b.priceMonthly == null) return NextResponse.json({ error: t("Thiếu thông tin") }, { status: 400 });
  let specs: any = undefined;
  if (b.specs) { try { specs = typeof b.specs === "string" ? JSON.parse(b.specs) : b.specs; } catch { return NextResponse.json({ error: t("Specs JSON không hợp lệ") }, { status: 400 }); } }
  const product = await prisma.product.create({
    data: {
      category, name: String(b.name), slug: String(b.slug || b.name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: b.description || null,
      priceMonthly: Number(b.priceMonthly) || 0, priceYearly: b.priceYearly ? Number(b.priceYearly) : null,
      setupFee: Number(b.setupFee) || 0, specs,
      stock: b.stock === "" || b.stock == null ? null : parseInt(b.stock, 10),
      isActive: b.isActive !== false, sortOrder: parseInt(b.sortOrder, 10) || 0,
    },
  });
  return NextResponse.json({ success: true, data: product });
}
