"use client";

import { useTrades } from "@/hooks/useTrades";

export function ActivityFeed() {
  const trades = useTrades(4000);

  return (
    <div className="space-y-2 text-[11px]">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">Live feed</p>
      <ul className="max-h-[200px] space-y-1 overflow-auto">
        {trades.slice(0, 8).map((t) => (
          <li key={t.id} className="flex justify-between text-muted-foreground">
            <span>Trade {t.id.slice(0, 6)}…</span>
            <span>{Number(t.amount_usdt).toFixed(2)} USDT</span>
          </li>
        ))}
        {trades.length === 0 && <li className="text-muted-foreground">Waiting for activity…</li>}
      </ul>
    </div>
  );
}
