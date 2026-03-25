"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<{
    status?: string;
    [k: string]: unknown;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await fetch(`/api/orders/${id}`);
      if (r.ok) setOrder(await r.json());
    })();
  }, [id]);

  if (!order) return <div className="p-10 text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-semibold">Order</h1>
      <pre className="mt-4 overflow-auto rounded-lg bg-muted p-4 text-xs">
        {JSON.stringify(order, null, 2)}
      </pre>
      {order.status === "awaiting_payment" && (
        <Link href={`/orders/upload-proof/${id}`} className="mt-4 inline-block text-primary underline">
          Upload payment proof URL →
        </Link>
      )}
      <Link href="/orders" className="mt-4 block text-muted-foreground underline">
        ← All orders
      </Link>
    </div>
  );
}
