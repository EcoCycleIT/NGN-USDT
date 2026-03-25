"use client";

import { useRate } from "@/hooks/useRate";
import { formatNgn } from "@/lib/rate-engine";
import { TrendingDown, TrendingUp } from "lucide-react";

export function PriceTicker() {
  const { rate } = useRate();
  if (!rate) {
    return <div className="h-10 animate-pulse rounded bg-muted" />;
  }
  const up = rate.change24hPct >= 0;

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <div>
        <p className="text-[10px] uppercase text-muted-foreground">USDT/NGN</p>
        <p className="text-xl font-semibold tabular-nums">₦{formatNgn(rate.ngnPerUsdt)}</p>
      </div>
      <div
        className={`flex items-center gap-1 ${up ? "text-bid" : "text-ask"}`}
      >
        {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span>{rate.change24hPct.toFixed(2)}%</span>
      </div>
      <div className="text-xs text-muted-foreground">
        <span className="block">24h H ₦{formatNgn(rate.high24h)}</span>
        <span className="block">24h L ₦{formatNgn(rate.low24h)}</span>
      </div>
      <div className="text-xs text-muted-foreground">
        Vol ≈ {(rate.volume24hUsd / 1e6).toFixed(2)}M (ref)
      </div>
    </div>
  );
}
