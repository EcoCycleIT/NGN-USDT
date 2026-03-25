import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** MVP: return static virtual account from env — wire Monnify/Flutterwave later */
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    bankName: process.env.VIRTUAL_BANK_NAME ?? "Demo Bank PLC",
    accountName: process.env.VIRTUAL_ACCOUNT_NAME ?? "NGN-USDT Exchange Collections",
    accountNumber: process.env.VIRTUAL_ACCOUNT_NUMBER ?? "9988776655",
    reference: `DEP-${user.id.slice(0, 8).toUpperCase()}`,
  });
}
