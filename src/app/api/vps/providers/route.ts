import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const providers = await prisma.vpsProvider.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json({ success: true, data: providers });
}
