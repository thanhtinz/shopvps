import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public knowledgebase: categories with their published articles (titles only).
export async function GET() {
  const items = await prisma.kbCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      articles: {
        where: { isPublished: true },
        select: { id: true, title: true, slug: true, views: true },
        orderBy: { views: "desc" },
      },
    },
  });
  return NextResponse.json({ success: true, data: items });
}
