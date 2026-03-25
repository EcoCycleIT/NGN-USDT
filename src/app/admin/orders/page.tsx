"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type OrderRow = {
  id: string;
  side: string;
  status: string;
  amount_ngn: string;
  amount_usdt: string;
  user_id: string;
};

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);

  async function load() {
    const r = await fetch("/api/admin/orders");
    if (r.ok) setRows(await r.json());
  }

  useEffect(() => {
    void load();
  }, []);

  async function act(id: string, action: "approve_buy" | "approve_sell" | "reject") {
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, action }),
    });
    void load();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-xl font-semibold">Order management</h1>
      <ul className="mt-6 space-y-3">
        {rows.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-4 text-sm">
            <div>
              <p className="font-mono text-xs">{o.id}</p>
              <p>
                {o.side} · ₦{Number(o.amount_ngn).toLocaleString()} · {o.amount_usdt} USDT
              </p>
              <Badge>{o.status}</Badge>
            </div>
            <div className="flex gap-2">
              {o.side === "buy" && (o.status === "awaiting_payment" || o.status === "pending_review") && (
                <Button size="sm" onClick={() => act(o.id, "approve_buy")}>
                  Approve buy
                </Button>
              )}
              {o.status === "pending_review" && (
                <Button size="sm" onClick={() => act(o.id, "approve_sell")}>
                  Mark NGN paid
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={() => act(o.id, "reject")}>
                Reject
              </Button>
            </div>
          </li>
        ))}
        {rows.length === 0 && <p className="text-muted-foreground">No pending orders</p>}
      </ul>
    </div>
  );
}
