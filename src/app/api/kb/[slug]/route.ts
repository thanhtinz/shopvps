import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public article detail; bumps the view counter.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.kbArticle.findFirst({
    where: { slug, isPublished: true },
    include: { category: { select: { name: true, slug: true } } },
  });
  if (!article) return NextResponse.json({ error: "Không tìm thấy bài viết" }, { status: 404 });
  await prisma.kbArticle.update({ where: { id: article.id }, data: { views: { increment: 1 } } });
  return NextResponse.json({ success: true, data: article });
}
