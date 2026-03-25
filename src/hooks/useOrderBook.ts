"use client";

import { useEffect, useState } from "react";

export type OrderBookData = {
  mid: number;
  spread: number;
  bids: { price: number; amount: number; total: number }[];
  asks: { price: number; amount: number; total: number }[];
  updatedAt: string;
};

export function useOrderBook(intervalMs = 2000) {
  const [book, setBook] = useState<OrderBookData | null>(null);

  useEffect(() => {
    const tick = async () => {
      const r = await fetch("/api/orderbook");
      if (r.ok) setBook(await r.json());
    };
    void tick();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return book;
}
