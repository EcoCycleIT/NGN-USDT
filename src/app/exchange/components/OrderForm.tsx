"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { feeBps } from "@/lib/fees";
import { useRate } from "@/hooks/useRate";
import { formatNgn } from "@/lib/rate-engine";

export function OrderForm({ onPlaced }: { onPlaced?: () => void }) {
  const { rate } = useRate();
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop_limit">("market");
  const [amountNgn, setAmountNgn] = useState("");
  const [amountUsdt, setAmountUsdt] = useState("");
  const [price, setPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [, setPct] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [lockUntil, setLockUntil] = useState<string | null>(null);

  const mid = rate?.ngnPerUsdt ?? 0;

  async function submit() {
    setLoading(true);
    setMsg(null);
    const body: Record<string, unknown> = { side, orderType };
    if (orderType === "market") {
      if (side === "buy") {
        if (amountNgn) body.amountNgn = Number(amountNgn.replace(/,/g, ""));
        else if (amountUsdt) body.amountUsdt = Number(amountUsdt);
      } else {
        body.amountUsdt = Number(amountUsdt);
      }
    } else if (orderType === "limit") {
      body.price = Number(price);
      body.amountUsdt = Number(amountUsdt) || Number(amountNgn) / Number(price);
    } else {
      body.stopPrice = Number(stopPrice);
      body.limitPrice = Number(limitPrice);
      body.amountUsdt = Number(amountUsdt);
    }

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setMsg(typeof data.error === "string" ? data.error : "Failed");
      return;
    }
    setMsg("Order placed");
    setLockUntil(data.rate_lock_expires_at ?? null);
    onPlaced?.();
  }

  const est = (() => {
    const n = Number(amountNgn.replace(/,/g, ""));
    const u = Number(amountUsdt);
    if (orderType === "market" && side === "buy" && n > 0 && mid) return { ngn: n, usdt: n / mid };
    if (orderType === "market" && side === "buy" && u > 0) return { ngn: u * mid, usdt: u };
    if (orderType === "market" && side === "sell" && u > 0) return { ngn: u * mid, usdt: u };
    return null;
  })();

  const feePct = feeBps() / 100;

  return (
    <div className="space-y-3">
      <Tabs value={side} onValueChange={(v) => setSide(v as "buy" | "sell")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="text-bid">
            Buy
          </TabsTrigger>
          <TabsTrigger value="sell" className="text-ask">
            Sell
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-1 text-xs">
        {(["market", "limit", "stop_limit"] as const).map((t) => (
          <Button
            key={t}
            type="button"
            variant={orderType === t ? "default" : "outline"}
            size="sm"
            className="flex-1 capitalize"
            onClick={() => setOrderType(t)}
          >
            {t.replace("_", " ")}
          </Button>
        ))}
      </div>

      {orderType === "market" && side === "buy" && (
        <>
          <div>
            <Label>Amount (NGN)</Label>
            <Input
              value={amountNgn}
              onChange={(e) => setAmountNgn(e.target.value)}
              placeholder="500000"
            />
          </div>
          <div>
            <Label>or USDT</Label>
            <Input
              value={amountUsdt}
              onChange={(e) => setAmountUsdt(e.target.value)}
              placeholder="100"
            />
          </div>
        </>
      )}

      {orderType === "market" && side === "sell" && (
        <div>
          <Label>Amount (USDT)</Label>
          <Input value={amountUsdt} onChange={(e) => setAmountUsdt(e.target.value)} />
        </div>
      )}

      {orderType === "limit" && (
        <>
          <div>
            <Label>Price (NGN per USDT)</Label>
            <Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder={String(mid)} />
          </div>
          <div>
            <Label>Amount (USDT)</Label>
            <Input value={amountUsdt} onChange={(e) => setAmountUsdt(e.target.value)} />
          </div>
        </>
      )}

      {orderType === "stop_limit" && (
        <>
          <div>
            <Label>Stop</Label>
            <Input value={stopPrice} onChange={(e) => setStopPrice(e.target.value)} />
          </div>
          <div>
            <Label>Limit</Label>
            <Input value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} />
          </div>
          <div>
            <Label>Amount (USDT)</Label>
            <Input value={amountUsdt} onChange={(e) => setAmountUsdt(e.target.value)} />
          </div>
        </>
      )}

      <div className="flex gap-1">
        {[25, 50, 75, 100].map((p) => (
          <Button
            key={p}
            type="button"
            variant="outline"
            size="sm"
            className="flex-1 text-[10px]"
            onClick={() => {
              setPct(p);
              if (mid && rate) {
                const base = 1_000_000 * (p / 100);
                setAmountNgn(String(Math.round(base)));
              }
            }}
          >
            {p}%
          </Button>
        ))}
      </div>

      {est && (
        <p className="text-[11px] text-muted-foreground">
          Est ≈ ₦{formatNgn(est.ngn)} / {est.usdt.toFixed(4)} USDT · Fee ~{feePct}% (
          {orderType === "market" ? "taker" : "maker"})
        </p>
      )}

      {lockUntil && (
        <p className="text-[11px] text-amber-500">
          Rate locked until {new Date(lockUntil).toLocaleTimeString()}
        </p>
      )}

      {msg && <p className="text-xs text-muted-foreground">{msg}</p>}

      <Button className="w-full" onClick={() => void submit()} disabled={loading}>
        {loading ? "Submitting…" : `Place ${side} order`}
      </Button>
    </div>
  );
}
