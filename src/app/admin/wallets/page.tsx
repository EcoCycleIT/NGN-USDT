import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminWalletsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Wallets</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Aggregate <code className="rounded bg-muted px-1">wallets</code> with service role for
          monitoring.
        </CardContent>
      </Card>
    </div>
  );
}
