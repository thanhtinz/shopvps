import { NextResponse } from "next/server";
import { PRODUCT_GROUPS, PRODUCT_TYPES } from "@/lib/products";

// Public taxonomy (groups + types) for the store and admin product form.
export async function GET() {
  return NextResponse.json({ success: true, data: { groups: PRODUCT_GROUPS, types: PRODUCT_TYPES } });
}
