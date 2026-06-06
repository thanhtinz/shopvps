import { NextRequest, NextResponse } from "next/server";
import { optionsForScope } from "@/lib/config-options";

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const productId = u.searchParams.get("productId");
  const scope = u.searchParams.get("scope");
  const refId = u.searchParams.get("refId");
  if (productId) return NextResponse.json({ success: true, data: await optionsForScope("product", productId) });
  if (scope) return NextResponse.json({ success: true, data: await optionsForScope(scope, refId || null) });
  return NextResponse.json({ success: true, data: [] });
}
