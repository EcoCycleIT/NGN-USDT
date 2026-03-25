/**
 * Quick Supabase connectivity check.
 * Loads .env.local then .env (first wins for each key).
 * Usage: npm run test:supabase
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";
import { existsSync } from "fs";

const root = resolve(process.cwd());
const envBase = resolve(root, ".env");
const envLocal = resolve(root, ".env.local");
if (existsSync(envBase)) config({ path: envBase, quiet: true });
if (existsSync(envLocal)) config({ path: envLocal, override: true, quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

function fail(msg) {
  console.error("FAIL:", msg);
  process.exit(1);
}

if (!url || !anon) {
  fail("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local or .env)");
}

console.log("Testing Supabase…");

const anonClient = createClient(url, anon);
const { error: anonErr } = await anonClient.from("profiles").select("*", { count: "exact", head: true });

if (anonErr) {
  if (
    anonErr.message?.includes("relation") ||
    anonErr.message?.includes("does not exist") ||
    anonErr.code === "42P01"
  ) {
    fail(`Table 'profiles' missing — run migrations. ${anonErr.message}`);
  }
  console.log("Anon (RLS):", anonErr.message);
} else {
  console.log("Anon client: OK (profiles reachable under RLS)");
}

if (!service) {
  console.warn("SKIP: SUPABASE_SERVICE_ROLE_KEY not set — cannot verify all tables.");
  process.exit(0);
}

const admin = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const tables = ["profiles", "wallets", "orders", "trades"];
for (const t of tables) {
  const { error, count } = await admin.from(t).select("*", { count: "exact", head: true });
  if (error) {
    fail(`Table '${t}': ${error.message}`);
  }
  console.log(`Service role → '${t}': OK (rows≈${count ?? "?"})`);
}

console.log("\nPASS: Supabase URL, keys, and core tables look good.");
