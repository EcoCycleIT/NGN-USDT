import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/auth-helpers";
import {
  adminApproveBuy,
  adminReject,
  devFallbackEnabled,
  getDevWallet,
  isMissingSchemaError,
  listDevPendingForAdmin,
} from "@/lib/dev-fallback-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("orders")
    .select("*")
    .in("status", ["awaiting_payment", "pending_review"])
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    if (devFallbackEnabled() && isMissingSchemaError(error)) {
      return NextResponse.json(listDevPendingForAdmin());
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const orderId = json?.orderId as string | undefined;
  const action = json?.action as "approve_buy" | "approve_sell" | "reject" | undefined;
  if (!orderId || !action) {
    return NextResponse.json({ error: "orderId and action required" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data: order } = await sb.from("orders").select("*").eq("id", orderId).single();
  if (!order) {
    if (devFallbackEnabled()) {
      if (action === "approve_buy") {
        const o = adminApproveBuy(orderId);
        if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ ok: true });
      }
      if (action === "reject") {
        const o = adminReject(orderId);
        if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json({ ok: true });
      }
    }
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    action === "approve_buy" &&
    order.side === "buy" &&
    (order.status === "awaiting_payment" || order.status === "pending_review")
  ) {
    const amt = Number(order.amount_usdt) - Number(order.fee_usdt ?? 0);
    const { data: w } = await sb.from("wallets").select("*").eq("user_id", order.user_id).single();
    const bal = Number(w?.usdt_balance ?? 0);
    const wu = await sb.from("wallets").update({ usdt_balance: bal + amt }).eq("user_id", order.user_id);
    if (wu.error && devFallbackEnabled() && isMissingSchemaError(wu.error)) {
      getDevWallet(order.user_id).usdt = bal + amt;
    }
    await sb.from("orders").update({ status: "filled" }).eq("id", orderId);
    await sb.from("trades").insert({
      price: order.rate_locked,
      amount_usdt: order.amount_usdt,
      amount_ngn: order.amount_ngn,
      buyer_id: order.user_id,
      taker_side: "buy",
      buy_order_id: orderId,
    });
    await sb.from("audit_logs").insert({
      admin_id: user.id,
      action: "approve_buy",
      entity_type: "order",
      entity_id: orderId,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "approve_sell" && order.status === "pending_review") {
    const ngn = Number(order.amount_ngn);
    const { data: w } = await sb.from("wallets").select("*").eq("user_id", order.user_id).single();
    const ngnBal = Number(w?.ngn_balance ?? 0);
    await sb
      .from("wallets")
      .update({ ngn_balance: ngnBal + ngn })
      .eq("user_id", order.user_id);
    await sb.from("orders").update({ status: "filled" }).eq("id", orderId);
    await sb.from("trades").insert({
      price: order.rate_locked,
      amount_usdt: order.amount_usdt,
      amount_ngn: order.amount_ngn,
      seller_id: order.user_id,
      taker_side: "sell",
      sell_order_id: orderId,
    });
    await sb.from("audit_logs").insert({
      admin_id: user.id,
      action: "approve_sell",
      entity_type: "order",
      entity_id: orderId,
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await sb.from("orders").update({ status: "rejected" }).eq("id", orderId);
    await sb.from("audit_logs").insert({
      admin_id: user.id,
      action: "reject_order",
      entity_type: "order",
      entity_id: orderId,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid transition" }, { status: 400 });
}
