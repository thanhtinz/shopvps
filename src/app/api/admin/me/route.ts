import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Lightweight self lookup for the admin sidebar to gate nav by permission.
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = session.user as any;
  return NextResponse.json({ success: true, data: { role: u.role, adminPermissions: u.adminPermissions || [] } });
}
