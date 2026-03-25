"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DepositPage() {
  const [va, setVa] = useState<{
    bankName: string;
    accountName: string;
    accountNumber: string;
    reference: string;
  } | null>(null);

  useEffect(() => {
    void (async () => {
      const r = await fetch("/api/deposit/virtual-account");
      if (r.ok) setVa(await r.json());
    })();
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Deposit NGN</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {va ? (
            <>
              <p>
                <span className="text-muted-foreground">Bank:</span> {va.bankName}
              </p>
              <p>
                <span className="text-muted-foreground">Account name:</span> {va.accountName}
              </p>
              <p className="font-mono text-lg">{va.accountNumber}</p>
              <p className="text-xs text-muted-foreground">Ref: {va.reference}</p>
            </>
          ) : (
            <p>Loading…</p>
          )}
          <Link href="/wallet" className="mt-4 inline-block text-primary underline">
            ← Back
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
