import { NextResponse } from "next/server";
import { getActiveGames } from "@/lib/games";

export async function GET() {
  return NextResponse.json({ success: true, data: await getActiveGames() });
}
