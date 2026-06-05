import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Persist the signed-in user's interface language so transactional emails
// (including those sent from background workers) can match their preference.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { locale } = await req.json().catch(() => ({ locale: undefined }));
  if (locale !== "vi" && locale !== "en") {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }
  await prisma.user.update({ where: { id: session.user.id }, data: { locale } });
  return NextResponse.json({ success: true });
}
