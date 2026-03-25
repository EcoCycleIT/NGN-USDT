import { NextResponse } from "next/server";
import type { Timeframe } from "@/lib/chart-config";
import { binanceInterval } from "@/lib/chart-config";

export const dynamic = "force-dynamic";

/** Proxy Binance klines — use USDT pair proxy; NGN may not exist — use BTCUSDT as stand-in for chart shape */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tf = (searchParams.get("tf") ?? "15m") as Timeframe;
  const interval = binanceInterval(tf);
  const limit = Math.min(Number(searchParams.get("limit") ?? 200), 1000);

  const url = `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${interval}&limit=${limit}`;
  const res = await fetch(url, { next: { revalidate: 10 } });
  if (!res.ok) return NextResponse.json([], { status: 200 });
  const raw = (await res.json()) as [
    number,
    string,
    string,
    string,
    string,
    string,
    number,
    string,
    number,
    string,
    string,
    string,
  ][];

  const candles = raw.map((k) => ({
    time: Math.floor(k[0] / 1000) as number,
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));

  return NextResponse.json(candles);
}
