import { NextResponse } from "next/server";
import { getCatalogToggles } from "@/lib/products";

// Public on/off map for sellable categories — used by the store and nav.
export async function GET() {
  return NextResponse.json({ success: true, data: await getCatalogToggles() });
}
