import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerT } from "@/lib/i18n/server";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const items = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ success: true, data: items });
}

export async function POST(req: NextRequest) {
  const { t } = await getServerT();
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { title, content, type, isActive, isPopup, expiresAt } = await req.json();
  if (!title?.trim() || !content?.trim())
    return NextResponse.json({ error: t("Thiếu tiêu đề hoặc nội dung") }, { status: 400 });
  const item = await prisma.announcement.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      type: type || "info",
      isActive: isActive ?? true,
      isPopup: isPopup ?? false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
  });
  return NextResponse.json({ success: true, data: item });
}
