import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { getServerT } from "@/lib/i18n/server";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { categoryId, title, content, isPublished } = await req.json();
  if (!categoryId || !title?.trim() || !content?.trim())
    return NextResponse.json({ error: t("Thiếu thông tin bài viết") }, { status: 400 });
  const item = await prisma.kbArticle.create({
    data: { categoryId, title: title.trim(), slug: slugify(title), content: content.trim(), isPublished: isPublished ?? true },
  });
  return NextResponse.json({ success: true, data: item });
}
