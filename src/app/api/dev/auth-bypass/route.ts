import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { ensureDevUser, setDevRole } from "@/lib/dev-fallback-store";

type BypassRole = "user" | "admin";

function devDummyAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_DUMMY_AUTH === "true";
}

export async function POST(req: Request) {
  if (!devDummyAuthEnabled()) {
    return NextResponse.json({ error: "Dev dummy auth disabled" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { role?: BypassRole };
  const role: BypassRole = body.role === "admin" ? "admin" : "user";
  const password = process.env.DEV_BYPASS_PASSWORD ?? "devpass123!";
  const email = role === "admin" ? "dev-admin@local.test" : "dev-user@local.test";

  const sb = createServiceClient();

  let userId: string | undefined;
  const { data: listed } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = listed.users.find((u) => u.email?.toLowerCase() === email);
  if (existing) {
    userId = existing.id;
  } else {
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { source: "dev-bypass" },
    });
    if (createErr || !created.user) {
      return NextResponse.json(
        { error: createErr?.message ?? "Could not create bypass user" },
        { status: 500 },
      );
    }
    userId = created.user.id;
  }

  await sb.from("profiles").upsert(
    {
      id: userId,
      full_name: role === "admin" ? "Dev Admin" : "Dev User",
      role,
      kyc_tier: 1,
      kyc_status: "approved",
    },
    { onConflict: "id" },
  );

  await sb.from("wallets").upsert(
    { user_id: userId, usdt_balance: role === "admin" ? 0 : 1500, ngn_balance: 250000 },
    { onConflict: "user_id" },
  );

  // Always seed in-memory fallback store for local smoke tests.
  ensureDevUser(userId, role);
  setDevRole(userId, role);

  return NextResponse.json({ ok: true, email, password, role });
}
