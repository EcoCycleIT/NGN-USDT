import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { proofUrlSchema } from "@/lib/validation";
import {
  devFallbackEnabled,
  getDevOrder,
  isMissingSchemaError,
  updateDevOrder,
} from "@/lib/dev-fallback-store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();
  if (error) {
    if (devFallbackEnabled() && isMissingSchemaError(error)) {
      const order = getDevOrder(user.id, id);
      if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json(order);
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = proofUrlSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "proofUrl required" }, { status: 400 });
  }
  const { error } = await supabase
    .from("orders")
    .update({
      payment_proof_url: parsed.data.proofUrl,
      status: "pending_review",
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "awaiting_payment");
  if (error) {
    if (devFallbackEnabled() && isMissingSchemaError(error)) {
      const updated = updateDevOrder(user.id, id, {
        payment_proof_url: parsed.data.proofUrl,
        status: "pending_review",
      });
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
