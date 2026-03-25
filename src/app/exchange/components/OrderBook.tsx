"use client";

import { useOrderBook } from "@/hooks/useOrderBook";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatNgn } from "@/lib/rate-engine";

export function OrderBook() {
  const book = useOrderBook(1500);

  if (!book) {
    return <div className="text-xs text-muted-foreground">Loading order book…</div>;
  }

  const maxBid = Math.max(...book.bids.map((b) => b.total), 1);
  const maxAsk = Math.max(...book.asks.map((a) => a.total), 1);

  return (
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div>
        <div className="mb-1 flex justify-between text-[10px] text-bid">
          <span>Bid</span>
          <span>Size</span>
        </div>
        <ScrollArea className="h-[280px] rounded-md border border-border/60 pr-2">
          <div className="space-y-0.5">
            {book.bids.slice(0, 14).map((b, i) => (
              <div key={i} className="relative flex justify-between py-0.5 font-mono">
                <span
                  className="absolute inset-y-0 left-0 bg-bid/15"
                  style={{ width: `${(b.total / maxBid) * 100}%` }}
                />
                <span className="relative z-10 text-bid">{formatNgn(b.price)}</span>
                <span className="relative z-10 text-muted-foreground">
                  {b.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-[10px] text-ask">
          <span>Ask</span>
          <span>Size</span>
        </div>
        <ScrollArea className="h-[280px] rounded-md border border-border/60 pr-2">
          <div className="space-y-0.5">
            {book.asks.slice(0, 14).map((a, i) => (
              <div key={i} className="relative flex justify-between py-0.5 font-mono">
                <span
                  className="absolute inset-y-0 right-0 bg-ask/15"
                  style={{ width: `${(a.total / maxAsk) * 100}%` }}
                />
                <span className="relative z-10 text-ask">{formatNgn(a.price)}</span>
                <span className="relative z-10 text-muted-foreground">
                  {a.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="col-span-2 flex justify-between border-t border-border pt-2 text-[10px] text-muted-foreground">
        <span>Spread</span>
        <span>{formatNgn(book.spread)}</span>
      </div>
    </div>
  );
}
