"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { getPublicSiteOrigin } from "@/lib/app-url";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const emailSchema = z.string().trim().email();
const passwordSchema = z.string().min(8, "Use at least 8 characters");

function SignInForm() {
  const sp = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const devDummyEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_DUMMY_AUTH === "true";

  const nextPath = sp.get("next");
  const safeNext =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/kyc";

  async function submitPasswordAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    setError(null);
    const emailParsed = emailSchema.safeParse(email);
    const passParsed = passwordSchema.safeParse(password);
    if (!emailParsed.success) {
      setLoading(false);
      setError("Enter a valid email address.");
      return;
    }
    if (!passParsed.success) {
      setLoading(false);
      setError(passParsed.error.issues[0]?.message ?? "Invalid password");
      return;
    }

    const supabase = createClient();
    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email: emailParsed.data,
        password: passParsed.data,
        options: {
          emailRedirectTo: `${getPublicSiteOrigin()}/auth/callback?next=${encodeURIComponent(safeNext)}`,
        },
      });
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
      setMsg(
        "If email confirmation is on in Supabase, check your inbox. Otherwise you can sign in now.",
      );
      setMode("signin");
      return;
    }

    const { error: err } = await supabase.auth.signInWithPassword({
      email: emailParsed.data,
      password: passParsed.data,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    window.location.href = safeNext;
  }

  async function devDummyLogin(role: "user" | "admin") {
    setLoading(true);
    setMsg(null);
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
      setError(data.error ?? "Dummy login failed");
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
    if (data.role === "admin") {
      window.location.href = "/admin/orders";
      return;
    }
    window.location.href = safeNext;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{mode === "signin" ? "Sign in" : "Create account"}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Email and password only. Enable the Email provider in Supabase Authentication.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={(e) => void submitPasswordAuth(e)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>
          {msg && <p className="text-sm text-muted-foreground">{msg}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                  setMsg(null);
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setMsg(null);
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>

        {devDummyEnabled && (
          <div className="space-y-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="text-xs text-amber-300">Local dummy accounts (development only)</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={loading}
                onClick={() => void devDummyLogin("user")}
              >
                Login as Dev User
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={loading}
                onClick={() => void devDummyLogin("admin")}
              >
                Login as Dev Admin
              </Button>
            </div>
          </div>
        )}

        <p className="text-center text-sm">
          <Link href="/" className="text-primary underline">
            Home
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center px-4">
      <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
        <SignInForm />
      </Suspense>
    </div>
  );
}
