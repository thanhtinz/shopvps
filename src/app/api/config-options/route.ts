import { NextRequest, NextResponse } from "next/server";
import { optionsForProduct } from "@/lib/config-options";

export async function GET(req: NextRequest) {
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ success: true, data: [] });
  return NextResponse.json({ success: true, data: await optionsForProduct(productId) });
}
