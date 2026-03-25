"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export function OrderHistory() {
  const [rows, setRows] = useState<
    {
      id: string;
      side: string;
      order_type: string;
      status: string;
      amount_ngn: string;
      created_at: string;
    }[]
  >([]);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/orders");
      if (!r.ok) return;
      setRows(await r.json());
    })();
  }, []);

  return (
    <div className="max-h-[200px] space-y-1 overflow-auto text-xs">
      {rows.slice(0, 20).map((o) => (
        <div key={o.id} className="flex justify-between gap-2 border-b border-border/30 py-1">
          <span className="text-muted-foreground">{new Date(o.created_at).toLocaleString()}</span>
          <span>{o.side}</span>
          <Badge variant="secondary">{o.status}</Badge>
        </div>
      ))}
    </div>
  );
}
