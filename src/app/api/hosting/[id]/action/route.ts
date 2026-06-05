import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { action } = await req.json();
  const hosting = await prisma.hostingOrder.findFirst({
    where: { id: (await params).id, userId: session.user.id },
    include: { server: true },
  });
  if (!hosting) return NextResponse.json({ error: "Hosting không tồn tại" }, { status: 404 });

  // WHM API actions would go here
  await prisma.activityLog.create({
    data: { userId: session.user.id, action, resource: "hosting", resourceId: (await params).id },
  });
  return NextResponse.json({ success: true });
}
