"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OpenOrders({ refresh }: { refresh?: number }) {
  const [rows, setRows] = useState<
    { id: string; side: string; order_type: string; status: string; amount_usdt: string }[]
  >([]);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/orders");
      if (!r.ok) return;
      const all = await r.json();
      setRows(
        (all as typeof rows).filter((o) =>
          ["open", "partially_filled", "awaiting_payment", "pending_review"].includes(o.status),
        ),
      );
    })();
  }, [refresh]);

  async function cancel(id: string) {
    await fetch(`/api/orders?id=${id}`, { method: "PATCH" });
    setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="max-h-[200px] space-y-1 overflow-auto text-xs">
      {rows.length === 0 ? (
        <p className="text-muted-foreground">No open orders</p>
      ) : (
        rows.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between rounded border border-border/50 px-2 py-1"
          >
            <span className={o.side === "buy" ? "text-bid" : "text-ask"}>{o.side}</span>
            <span className="font-mono">{o.order_type}</span>
            <Badge variant="outline">{o.status}</Badge>
            <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => cancel(o.id)}>
              Cancel
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
