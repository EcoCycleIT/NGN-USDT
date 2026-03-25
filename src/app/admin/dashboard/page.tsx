import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Orders", "/admin/orders", "Approve payments & settlements"],
          ["Users", "/admin/users", "User overview"],
          ["KYC queue", "/admin/kyc", "Manual review"],
          ["Wallets", "/admin/wallets", "Balances"],
          ["Settings", "/admin/settings", "Fees & limits"],
        ].map(([t, href, d]) => (
          <Link key={href} href={href}>
            <Card className="h-full transition-colors hover:bg-muted/40">
              <CardHeader>
                <CardTitle className="text-base">{t}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{d}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
