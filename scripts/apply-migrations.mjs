import { readFile } from "fs/promises";
import { resolve } from "path";
import { Client } from "pg";
import { config } from "dotenv";

config({ path: ".env", quiet: true });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

const files = [
  "supabase/migrations/20260325000000_exchange_core.sql",
  "supabase/migrations/20260325000001_wallets_update_policy.sql",
  "supabase/migrations/20260325000002_profiles_insert.sql",
];

const client = new Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  for (const f of files) {
    const sql = await readFile(resolve(f), "utf8");
    console.log(`Applying ${f}...`);
    await client.query(sql);
  }
  console.log("Migrations applied.");
} finally {
  await client.end();
}

