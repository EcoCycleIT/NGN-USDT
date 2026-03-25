# NGN–USDT Exchange (MVP)

Next.js 14 (App Router), TypeScript, Tailwind, shadcn-style UI, Supabase Auth (phone OTP), PostgreSQL + RLS, live rates (Binance P2P blend + SSE stream), trading UI (chart, order book, order forms), and admin order approval.

## 1. Supabase

Full checklist: **[docs/SUPABASE.md](./docs/SUPABASE.md)** (keys, auth URLs, phone provider, migrations, admin).

Quick version:

1. Create a project at [supabase.com](https://supabase.com).
2. Copy API keys into `.env.local` (from `.env.example`).
3. Set **Authentication → URL Configuration** (Site URL + redirect `http://localhost:3000/auth/callback`).
4. Enable **Phone** provider + SMS (e.g. Twilio).
5. Apply migrations: `npx supabase login` → `npx supabase link --project-ref <ref>` → `npx supabase db push`, **or** run the three SQL files in `supabase/migrations/` in order in the SQL Editor.
6. Promote admin: `update public.profiles set role = 'admin' where id = '<your auth user uuid>';`

## 2. Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to the client)
- Optional: virtual account vars for NGN deposit display.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000): **Sign in** (phone OTP) → **KYC** → **Exchange**.

## 4. Notes

- **Chart**: uses Binance `BTCUSDT` klines as a stand-in; swap to a USDT/NGN index when available.
- **Order book**: merges synthetic depth with real open limit orders from the database (requires `SUPABASE_SERVICE_ROLE_KEY` on the server).
- **Payment proof**: MVP uses a **URL** to a screenshot; replace with Supabase Storage uploads in production.
- **WebSockets**: live rates use **SSE** (`/api/rate/stream`) for Edge/serverless compatibility; order book polls `/api/orderbook`.
