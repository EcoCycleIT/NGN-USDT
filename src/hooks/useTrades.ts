"use client";

import { useEffect, useState } from "react";

export type TradeRow = {
  id: string;
  price: number;
  amount_usdt: number;
  amount_ngn: number;
  created_at: string;
  taker_side: string | null;
};

export function useTrades(intervalMs = 3000) {
  const [trades, setTrades] = useState<TradeRow[]>([]);

  useEffect(() => {
    const tick = async () => {
      const r = await fetch("/api/trades");
      if (r.ok) setTrades(await r.json());
    };
    void tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return trades;
}
