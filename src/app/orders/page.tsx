"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrdersListPage() {
  const [rows, setRows] = useState<{ id: string; status: string; side: string; created_at: string }[]>(
    [],
  );

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/orders");
      if (r.ok) setRows(await r.json());
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold">Orders</h1>
      <table className="mt-4 w-full text-left text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="py-2">ID</th>
            <th>Side</th>
            <th>Status</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id} className="border-b border-border/50">
              <td className="py-2 font-mono text-xs">{o.id.slice(0, 8)}…</td>
              <td>{o.side}</td>
              <td>{o.status}</td>
              <td>{new Date(o.created_at).toLocaleString()}</td>
              <td>
                <Link href={`/orders/${o.id}`} className="text-primary underline">
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
