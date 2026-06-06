import { NextResponse } from "next/server";

// Lightweight liveness probe for platform healthchecks (Railway). Always 200 as
// long as the Node server is up — no DB/Redis/auth so the setup/license gate and
// external services can't make the deploy look unhealthy.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok", ts: Date.now() }, { status: 200 });
}

export function HEAD() {
  return new NextResponse(null, { status: 200 });
}
