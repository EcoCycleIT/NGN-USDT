"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WithdrawPage() {
  const [amount, setAmount] = useState("");
  const [addr, setAddr] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amountUsdt: Number(amount),
        destinationAddress: addr,
      }),
    });
    const data = await r.json();
    setMsg(r.ok ? "Request submitted (24h whitelist hold)." : data.error ?? "Error");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Withdraw USDT</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div>
              <Label>Amount (USDT)</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div>
              <Label>TRC20 address</Label>
              <Input value={addr} onChange={(e) => setAddr(e.target.value)} required />
            </div>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
            <Button type="submit">Submit</Button>
          </form>
          <Link href="/wallet" className="mt-4 inline-block text-primary underline">
            ← Back
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
