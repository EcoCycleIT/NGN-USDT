import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <nav className="mb-10 flex justify-center gap-6 text-sm text-muted-foreground">
        <Link href="/exchange" className="hover:text-foreground">
          Exchange
        </Link>
        <Link href="/auth/signin" className="hover:text-foreground">
          Sign in
        </Link>
        <Link href="/admin/dashboard" className="hover:text-foreground">
          Admin
        </Link>
      </nav>
      <p className="text-sm font-medium uppercase tracking-widest text-primary">Supabase + Next.js 14</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight">NGN–USDT Exchange MVP</h1>
      <p className="mt-4 text-muted-foreground">
        Email/password auth, Tier-1 KYC, live rates (SSE + Binance P2P blend), professional trading UI with
        chart & order book, market/limit/stop orders, payment proof URLs, custodial wallets, and admin
        approvals.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/auth/signin">Get started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/exchange">Open exchange</Link>
        </Button>
      </div>
      <p className="mt-12 text-xs text-muted-foreground">
        Copy <code className="rounded bg-muted px-1">.env.example</code> → <code className="rounded bg-muted px-1">.env.local</code>{" "}
        and run the SQL migration in Supabase.
      </p>
    </div>
  );
}
