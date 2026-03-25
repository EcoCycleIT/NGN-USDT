import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminKycPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>KYC queue</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Filter <code className="rounded bg-muted px-1">profiles</code> where{" "}
          <code className="rounded bg-muted px-1">kyc_status = &apos;pending&apos;</code>.
        </CardContent>
      </Card>
    </div>
  );
}
