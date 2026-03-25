import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { withdrawalSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = withdrawalSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { amountUsdt, destinationAddress } = parsed.data;

  const sb = createServiceClient();
  const { data: w } = await sb.from("wallets").select("*").eq("user_id", user.id).single();
  const bal = Number(w?.usdt_balance ?? 0);
  if (bal < amountUsdt) {
    return NextResponse.json({ error: "Insufficient USDT" }, { status: 400 });
  }

  const hold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data: wd, error } = await sb
    .from("withdrawals")
    .insert({
      user_id: user.id,
      amount_usdt: amountUsdt,
      destination_address: destinationAddress,
      status: "pending",
      whitelist_hold_until: hold,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await sb
    .from("wallets")
    .update({ usdt_balance: bal - amountUsdt })
    .eq("user_id", user.id);

  return NextResponse.json(wd);
}
