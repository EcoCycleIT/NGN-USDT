"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BalanceWidget() {
  const [usdt, setUsdt] = useState("0");
  const [ngn, setNgn] = useState("0");

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/wallet/balance");
      if (!r.ok) return;
      const w = await r.json();
      setUsdt(String(w.usdt_balance ?? "0"));
      setNgn(String(w.ngn_balance ?? "0"));
    })();
  }, []);

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3 text-sm">
      <div className="flex justify-between gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground">USDT</p>
          <p className="font-mono text-lg">{Number(usdt).toFixed(4)}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">NGN</p>
          <p className="font-mono text-lg">₦{Number(ngn).toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-2 flex gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href="/wallet/deposit">Deposit</Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link href="/wallet/withdraw">Withdraw</Link>
        </Button>
      </div>
    </div>
  );
}
