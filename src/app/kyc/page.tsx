"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { mockValidateBvn } from "@/lib/bvn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KycPage() {
  const [fullName, setFullName] = useState("");
  const [bvn, setBvn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = mockValidateBvn(bvn);
    if (!v.ok) {
      setError(v.reason ?? "Invalid BVN");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not signed in");
      setLoading(false);
      return;
    }
    const { error: uerr } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        bvn,
        kyc_tier: 1,
        kyc_status: "approved",
      },
      { onConflict: "id" },
    );
    setLoading(false);
    if (uerr) {
      setError(uerr.message);
      return;
    }
    window.location.href = "/exchange";
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Tier 1 KYC</CardTitle>
          <p className="text-sm text-muted-foreground">
            Mock BVN check — swap for Youverify / Smile Identity in production.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div>
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div>
              <Label>BVN (11 digits)</Label>
              <Input
                value={bvn}
                onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                inputMode="numeric"
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Submit"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link href="/kyc/tier2" className="text-primary underline">
              Tier 2 (ID + address)
            </Link>{" "}
            ·{" "}
            <Link href="/kyc/status" className="text-muted-foreground underline">
              Status
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
