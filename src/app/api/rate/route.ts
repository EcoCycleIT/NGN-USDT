import { NextResponse } from "next/server";
import { getNgnUsdtRate } from "@/lib/rate-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const rate = await getNgnUsdtRate();
  return NextResponse.json(rate);
}
