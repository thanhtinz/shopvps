import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isProductCategory, isCategorySellable } from "@/lib/products";

// Active products of a category for the store (only if the category is sellable).
export async function GET(req: NextRequest) {
  const category = (new URL(req.url).searchParams.get("category") || "").toUpperCase();
  if (!isProductCategory(category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  if (!(await isCategorySellable(category))) return NextResponse.json({ success: true, data: [] });
  const products = await prisma.product.findMany({
    where: { category, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }],
  });
  return NextResponse.json({ success: true, data: products });
}
