"use client";

import { useEffect, useRef, useState } from "react";
import { CandlestickSeries, createChart } from "lightweight-charts";
import { chartLayout } from "@/lib/chart-config";
import type { Timeframe } from "@/lib/chart-config";
import { cn } from "@/lib/utils";

const TF: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

export function PriceChart() {
  const container = useRef<HTMLDivElement>(null);
  const [tf, setTf] = useState<Timeframe>("15m");

  useEffect(() => {
    if (!container.current) return;
    const chart = createChart(container.current, {
      ...(chartLayout as Record<string, unknown>),
      width: container.current.clientWidth,
      height: 380,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    let cancelled = false;
    void (async () => {
      const r = await fetch(`/api/chart/klines?tf=${tf}`);
      const data = r.ok ? await r.json() : [];
      if (cancelled || !Array.isArray(data)) return;
      series.setData(
        data.map(
          (c: { time: number; open: number; high: number; low: number; close: number }) => ({
            time: c.time as import("lightweight-charts").Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }),
        ),
      );
      chart.timeScale().fitContent();
    })();

    const ro = new ResizeObserver(() => {
      if (container.current) {
        chart.applyOptions({ width: container.current.clientWidth });
      }
    });
    ro.observe(container.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      chart.remove();
    };
  }, [tf]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        {TF.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTf(t)}
            className={cn(
              "rounded-md px-2 py-1 text-xs font-medium",
              tf === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>
      <div ref={container} className="min-h-[380px] w-full overflow-hidden rounded-lg border" />
      <p className="text-[10px] text-muted-foreground">
        Chart data: BTC/USDT klines (proxy). Replace with USDT/NGN index when available.
      </p>
    </div>
  );
}
