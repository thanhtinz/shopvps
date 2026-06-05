import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// A client sees their own quotes once sent (drafts stay hidden).
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const quotes = await prisma.quote.findMany({
    where: { userId: session.user.id, status: { not: "DRAFT" } },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return NextResponse.json({ success: true, data: quotes });
}
