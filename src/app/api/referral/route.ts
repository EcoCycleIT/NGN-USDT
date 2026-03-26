import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${origin}/auth/signin?ref=${profile?.referral_code ?? ""}`;
  const { data: refs } = await supabase
    .from("referrals")
    .select("reward_ngn, created_at, referee_id")
    .eq("referrer_id", user.id);
  return NextResponse.json({ code: profile?.referral_code, link, referrals: refs ?? [] });
}
