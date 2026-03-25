"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadProofPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proofUrl: url }),
    });
    const data = await r.json();
    if (!r.ok) {
      setMsg(data.error ?? "Failed");
      return;
    }
    router.push(`/orders/${id}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Payment proof (URL)</CardTitle>
          <p className="text-sm text-muted-foreground">
            MVP: paste a link to your transfer screenshot or receipt. Production: Supabase Storage upload.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void submit(e)} className="space-y-4">
            <div>
              <Label>Proof URL</Label>
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                required
              />
            </div>
            {msg && <p className="text-sm text-destructive">{msg}</p>}
            <Button type="submit">Submit</Button>
          </form>
          <Link href={`/orders/${id}`} className="mt-4 inline-block text-primary underline">
            ← Order
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
