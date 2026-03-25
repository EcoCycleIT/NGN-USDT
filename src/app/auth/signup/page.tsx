"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    let normalized = phone.trim().replace(/\s/g, "");
    if (!normalized.startsWith("+")) {
      normalized = normalized.startsWith("0")
        ? `+234${normalized.slice(1)}`
        : `+234${normalized}`;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setMsg(error.message);
      return;
    }
    setMsg("Check your phone for the OTP.");
    window.location.href = `/auth/verify?phone=${encodeURIComponent(normalized)}`;
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign in with phone</CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure SMS in Supabase (Twilio / MessageBird). E.164 format, e.g. +2348012345678.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void sendOtp(e)} className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+2348012345678"
                required
              />
            </div>
            {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send OTP"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already verified?{" "}
            <Link href="/auth/verify" className="text-primary underline">
              Enter code
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
