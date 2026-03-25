import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { devFallbackEnabled, getDevWallet, isMissingSchemaError } from "@/lib/dev-fallback-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase.from("wallets").select("*").eq("user_id", user.id).single();
  if (error) {
    if (devFallbackEnabled() && isMissingSchemaError(error)) {
      const w = getDevWallet(user.id);
      return NextResponse.json({ user_id: user.id, usdt_balance: w.usdt, ngn_balance: w.ngn });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
