import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seedDefaultGateways } from "@/lib/payments";

function isAdmin(session: any) {
  return session && ["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role);
}

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await seedDefaultGateways();
  const items = await prisma.paymentGateway.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ success: true, data: items });
}
