import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminUsersPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Connect this view to <code className="rounded bg-muted px-1">profiles</code> via service role
          API (pagination, search).
        </CardContent>
      </Card>
    </div>
  );
}
