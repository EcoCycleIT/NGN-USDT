"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function KycStatusPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [tier, setTier] = useState<number>(0);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("kyc_status, kyc_tier").eq("id", user.id).single();
      setStatus(data?.kyc_status ?? null);
      setTier(data?.kyc_tier ?? 0);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>KYC status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Tier: <Badge variant="secondary">{tier}</Badge>
          </p>
          <p>
            Status: <Badge>{status ?? "…"}</Badge>
          </p>
          <Link href="/kyc" className="text-primary underline">
            Update
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
