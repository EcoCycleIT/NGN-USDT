"use client";

import { useTrades } from "@/hooks/useTrades";
import { formatNgn } from "@/lib/rate-engine";

export function TradeHistory() {
  const trades = useTrades();

  return (
    <div className="max-h-[180px] space-y-1 overflow-auto text-[11px]">
      {trades.length === 0 ? (
        <p className="text-muted-foreground">No trades yet</p>
      ) : (
        trades.map((t) => (
          <div key={t.id} className="flex justify-between gap-2 border-b border-border/30 py-1 font-mono">
            <span className="text-muted-foreground">{new Date(t.created_at).toLocaleTimeString()}</span>
            <span className={t.taker_side === "buy" ? "text-bid" : "text-ask"}>
              {formatNgn(Number(t.price))}
            </span>
            <span>{Number(t.amount_usdt).toFixed(4)}</span>
          </div>
        ))
      )}
    </div>
  );
}
