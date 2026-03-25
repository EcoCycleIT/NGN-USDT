"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function TransactionsPage() {
  const [rows, setRows] = useState<{ id: string; amount_usdt: number; status: string; created_at: string }[]>(
    [],
  );

  useEffect(() => {
    void (async () => {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb
        .from("withdrawals")
        .select("id, amount_usdt, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setRows((data ?? []) as typeof rows);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-xl font-semibold">Withdrawals</h1>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((w) => (
          <li key={w.id} className="flex justify-between border-b border-border py-2">
            <span>{new Date(w.created_at).toLocaleString()}</span>
            <span>{w.amount_usdt} USDT</span>
            <span>{w.status}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-muted-foreground">No withdrawals yet</li>}
      </ul>
      <Link href="/wallet" className="mt-6 inline-block text-primary underline">
        ← Back
      </Link>
    </div>
  );
}
