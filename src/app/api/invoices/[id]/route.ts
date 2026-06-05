import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: { items: true, user: { select: { name: true, email: true } } },
  });
  if (!invoice) return NextResponse.json({ error: "Hoá đơn không tồn tại" }, { status: 404 });
  return NextResponse.json({ success: true, data: invoice });
}
