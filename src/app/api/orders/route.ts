import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { computeFeeUsdt, quoteMarketBuy, quoteMarketSell } from "@/lib/matching-engine";
import { canTradeAmount } from "@/lib/limits";
import {
  createDevOrder,
  devFallbackEnabled,
  getDevProfile,
  getDevWallet,
  isMissingSchemaError,
  listDevOrdersForUser,
  updateDevOrder,
} from "@/lib/dev-fallback-store";

const bodySchema = z.object({
  side: z.enum(["buy", "sell"]),
  orderType: z.enum(["market", "limit", "stop_limit"]),
  amountNgn: z.number().positive().optional(),
  amountUsdt: z.number().positive().optional(),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  limitPrice: z.number().positive().optional(),
});

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (devFallbackEnabled() && isMissingSchemaError(error)) {
      return NextResponse.json(listDevOrdersForUser(user.id));
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("kyc_tier, kyc_status")
    .eq("id", user.id)
    .single();

  const kyc = profileErr && devFallbackEnabled() && isMissingSchemaError(profileErr)
    ? { kyc_status: getDevProfile(user.id).status, kyc_tier: getDevProfile(user.id).tier }
    : profile;

  if (!kyc || kyc.kyc_status !== "approved" || kyc.kyc_tier < 1) {
    return NextResponse.json({ error: "Complete Tier-1 KYC before trading." }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const b = parsed.data;
  const tier = kyc.kyc_tier ?? 0;

  const lockMs = 3 * 60 * 1000;
  const lockUntil = new Date(Date.now() + lockMs).toISOString();

  try {
    if (b.orderType === "market" && b.side === "buy") {
      const q = await quoteMarketBuy(b.amountNgn, b.amountUsdt);
      if (!canTradeAmount(q.ngn, tier)) {
        return NextResponse.json({ error: "Exceeds tier daily limit" }, { status: 400 });
      }
      const fee = computeFeeUsdt(q.usdt);
      const sb = createServiceClient();
      const payload = {
        user_id: user.id,
        side: "buy" as const,
        order_type: "market" as const,
        amount_ngn: q.ngn,
        amount_usdt: q.usdt,
        rate_locked: q.price,
        rate_lock_expires_at: lockUntil,
        status: "awaiting_payment",
        fee_usdt: fee,
      };
      const { data, error } = await sb.from("orders").insert(payload).select().single();
      if (error) {
        if (devFallbackEnabled() && isMissingSchemaError(error)) {
          return NextResponse.json(createDevOrder(payload));
        }
        throw error;
      }
      return NextResponse.json(data);
    }

    if (b.orderType === "market" && b.side === "sell") {
      if (!b.amountUsdt) {
        return NextResponse.json({ error: "amountUsdt required for sell" }, { status: 400 });
      }
      const q = await quoteMarketSell(b.amountUsdt);
      const fee = computeFeeUsdt(q.usdt);
      const sb = createServiceClient();
      const { data: w } = await sb.from("wallets").select("*").eq("user_id", user.id).single();
      const bal = Number((w?.usdt_balance ?? getDevWallet(user.id).usdt) ?? 0);
      if (bal < b.amountUsdt + fee) {
        return NextResponse.json({ error: "Insufficient USDT" }, { status: 400 });
      }
      const walletUpdate = await sb
        .from("wallets")
        .update({ usdt_balance: bal - b.amountUsdt - fee })
        .eq("user_id", user.id);
      if (walletUpdate.error && devFallbackEnabled() && isMissingSchemaError(walletUpdate.error)) {
        getDevWallet(user.id).usdt = bal - b.amountUsdt - fee;
      }

      const payload = {
        user_id: user.id,
        side: "sell" as const,
        order_type: "market" as const,
        amount_ngn: q.ngn,
        amount_usdt: q.usdt,
        rate_locked: q.price,
        rate_lock_expires_at: lockUntil,
        status: "pending_review",
        fee_usdt: fee,
      };
      const { data, error } = await sb.from("orders").insert(payload).select().single();
      if (error) {
        if (devFallbackEnabled() && isMissingSchemaError(error)) {
          return NextResponse.json(createDevOrder(payload));
        }
        throw error;
      }
      return NextResponse.json(data);
    }

    if (b.orderType === "limit") {
      const price = b.price ?? b.limitPrice;
      if (!price) return NextResponse.json({ error: "price required" }, { status: 400 });
      const amountUsdt = b.amountUsdt ?? (b.amountNgn ? b.amountNgn / price : 0);
      if (!amountUsdt || amountUsdt <= 0) {
        return NextResponse.json({ error: "amount required" }, { status: 400 });
      }
      const ngn = b.amountNgn ?? amountUsdt * price;
      if (!canTradeAmount(ngn, tier)) {
        return NextResponse.json({ error: "Exceeds tier limit" }, { status: 400 });
      }
      const sb = createServiceClient();
      if (b.side === "sell") {
        const { data: w } = await sb.from("wallets").select("*").eq("user_id", user.id).single();
        const bal = Number(w?.usdt_balance ?? 0);
        if (bal < amountUsdt) {
          return NextResponse.json({ error: "Insufficient USDT" }, { status: 400 });
        }
        await sb
          .from("wallets")
          .update({ usdt_balance: bal - amountUsdt })
          .eq("user_id", user.id);
      }
      const { data, error } = await sb
        .from("orders")
        .insert({
          user_id: user.id,
          side: b.side,
          order_type: "limit",
          price,
          limit_price: price,
          amount_ngn: ngn,
          amount_usdt: amountUsdt,
          status: "open",
          fee_usdt: computeFeeUsdt(amountUsdt),
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }

    if (b.orderType === "stop_limit") {
      const stop = b.stopPrice;
      const limit = b.limitPrice ?? b.price;
      if (!stop || !limit || !b.amountUsdt) {
        return NextResponse.json({ error: "stopPrice, limitPrice, amountUsdt required" }, { status: 400 });
      }
      const sb = createServiceClient();
      const { data, error } = await sb
        .from("orders")
        .insert({
          user_id: user.id,
          side: b.side,
          order_type: "stop_limit",
          stop_price: stop,
          limit_price: limit,
          price: limit,
          amount_usdt: b.amountUsdt,
          amount_ngn: b.amountUsdt * limit,
          status: "open",
          fee_usdt: computeFeeUsdt(b.amountUsdt),
        })
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Order failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  return NextResponse.json({ error: "Unsupported" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("user_id", user.id)
    .in("status", ["open", "pending", "partially_filled"]);
  if (error) {
    if (devFallbackEnabled() && isMissingSchemaError(error)) {
      const updated = updateDevOrder(user.id, id, { status: "cancelled" });
      if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
