"use client";

import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function VerifyForm() {
  const sp = useSearchParams();
  const initialPhone = sp.get("phone") ?? "";
  const [phone, setPhone] = useState(initialPhone);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const devBypassEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_OTP_BYPASS === "true";

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    window.location.href = "/kyc";
  }

  async function devBypass(role: "user" | "admin") {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/dev/auth-bypass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      email?: string;
      password?: string;
      role?: "user" | "admin";
    };
    if (!res.ok || !data.email || !data.password) {
      setLoading(false);
      setError(data.error ?? "Bypass failed");
      return;
    }

    const supabase = createClient();
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setLoading(false);
    if (signInErr) {
      setError(signInErr.message);
      return;
    }
    window.location.href = data.role === "admin" ? "/admin/orders" : "/kyc";
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Verify OTP</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => void verify(e)} className="space-y-4">
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>
          <div>
            <Label>6-digit code</Label>
            <Input value={token} onChange={(e) => setToken(e.target.value)} required maxLength={8} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Verifying…" : "Continue"}
          </Button>
        </form>
        {devBypassEnabled && (
          <div className="mt-4 space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-300">Development OTP bypass</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={loading}
                onClick={() => void devBypass("user")}
              >
                Login as Dev User
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={loading}
                onClick={() => void devBypass("admin")}
              >
                Login as Dev Admin
              </Button>
            </div>
          </div>
        )}
        <p className="mt-4 text-center text-sm">
          <Link href="/auth/signup" className="text-primary underline">
            Back
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function VerifyPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4">
      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <VerifyForm />
      </Suspense>
    </div>
  );
}
