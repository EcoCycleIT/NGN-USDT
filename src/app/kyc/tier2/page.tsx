import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function KycTier2Page() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Tier 2 — Coming soon</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>ID document + address proof upload will be wired to storage + verification provider.</p>
          <Link href="/kyc" className="mt-4 inline-block text-primary underline">
            ← Tier 1
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
