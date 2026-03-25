import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Platform settings</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Store fees & limits in a <code className="rounded bg-muted px-1">platform_settings</code>{" "}
          table or environment variables. Current taker fee: 25 bps (see <code>lib/fees.ts</code>).
        </CardContent>
      </Card>
    </div>
  );
}
