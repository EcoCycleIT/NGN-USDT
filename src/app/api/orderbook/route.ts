import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { getNgnUsdtRate } from "@/lib/rate-engine";

export const dynamic = "force-dynamic";

type Level = { price: number; amount: number; total: number };

function buildSynthetic(mid: number): { bids: Level[]; asks: Level[] } {
  const bids: Level[] = [];
  const asks: Level[] = [];
  let cb = 0;
  let ca = 0;
  for (let i = 1; i <= 15; i++) {
    const bp = mid - i * 1.25 - Math.random() * 0.5;
    const ap = mid + i * 1.25 + Math.random() * 0.5;
    const sz = 800 + Math.random() * 9000;
    cb += sz;
    ca += sz;
    bids.push({ price: bp, amount: sz, total: cb });
    asks.unshift({ price: ap, amount: sz, total: ca });
  }
  return { bids, asks };
}

export async function GET() {
  const rate = await getNgnUsdtRate();
  const mid = rate.ngnPerUsdt;
  const { bids: synBids, asks: synAsks } = buildSynthetic(mid);

  try {
    const sb = createServiceClient();
    const { data: rows } = await sb
      .from("orders")
      .select("side, price, amount_usdt, amount_ngn, status, order_type")
      .eq("status", "open")
      .eq("order_type", "limit");

    const bidMap = new Map<number, number>();
    const askMap = new Map<number, number>();
    for (const r of rows ?? []) {
      const p = Number(r.price);
      if (!Number.isFinite(p)) continue;
      const amt = Number(r.amount_usdt ?? 0) || 0;
      if (r.side === "buy") bidMap.set(p, (bidMap.get(p) ?? 0) + amt);
      if (r.side === "sell") askMap.set(p, (askMap.get(p) ?? 0) + amt);
    }
    Array.from(bidMap.entries()).forEach(([p, a]) => {
      synBids.unshift({
        price: p,
        amount: a,
        total: (synBids[0]?.total ?? 0) + a,
      });
    });
    Array.from(askMap.entries()).forEach(([p, a]) => {
      synAsks.push({
        price: p,
        amount: a,
        total: (synAsks[synAsks.length - 1]?.total ?? 0) + a,
      });
    });
  } catch {
    /* synthetic only */
  }

  const bestBid = synBids[synBids.length - 1]?.price ?? mid;
  const bestAsk = synAsks[0]?.price ?? mid;

  return NextResponse.json({
    mid,
    spread: bestAsk - bestBid,
    bids: synBids.slice(0, 20),
    asks: synAsks.slice(0, 20),
    updatedAt: new Date().toISOString(),
  });
}
