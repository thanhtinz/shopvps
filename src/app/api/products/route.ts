import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isKnownGroup, isKnownType, groupOfType, isGroupSellable } from "@/lib/products";

// Active products for the store, filtered by ?group= or ?category= (type slug).
// Only returns items whose taxonomy group is currently sellable.
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const group = sp.get("group") || "";
  const category = sp.get("category") || "";

  const where: any = { isActive: true };
  if (group) {
    if (!isKnownGroup(group)) return NextResponse.json({ error: "Invalid group" }, { status: 400 });
    if (!(await isGroupSellable(group))) return NextResponse.json({ success: true, data: [] });
    where.group = group;
  } else if (category) {
    if (!isKnownType(category)) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    if (!(await isGroupSellable(groupOfType(category)))) return NextResponse.json({ success: true, data: [] });
    where.category = category;
  } else {
    return NextResponse.json({ error: "Missing group or category" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where, orderBy: [{ sortOrder: "asc" }, { priceMonthly: "asc" }],
  });
  return NextResponse.json({ success: true, data: products });
}
