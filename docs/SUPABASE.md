# Configure Supabase for NGN–USDT Exchange

Do this once per Supabase project.

## A. Create the project

1. Go [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Pick a region close to Nigeria if possible, set a database password, wait until the project is healthy.

## B. API keys (for the Next.js app)

1. **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **`anon` `public`** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **`service_role` `secret`** → `SUPABASE_SERVICE_ROLE_KEY` (never expose in the browser or client bundles)

3. In the project root, copy env template and fill values:

```bash
copy .env.example .env.local
```

(Edit `.env.local` on macOS/Linux: `cp .env.example .env.local`)

## C. Auth URLs + Email provider

1. **Authentication** → **URL Configuration**

   **Local development**

   - **Site URL**: `http://localhost:3000`
   - **Redirect URLs**: `http://localhost:3000/auth/callback`

   **Production (e.g. Vercel)** — required so confirmation emails do not point at localhost

   - In Vercel → your project → **Settings** → **Environment Variables** (Production), set  
     `NEXT_PUBLIC_APP_URL` = `https://YOUR_DEPLOYMENT.vercel.app` (no trailing slash), then redeploy.
   - In Supabase → **Authentication** → **URL Configuration**:
     - **Site URL**: use that same production URL (`https://YOUR_DEPLOYMENT.vercel.app`).
     - **Redirect URLs**: add  
       `https://YOUR_DEPLOYMENT.vercel.app/auth/callback`  
       (keep the localhost callback too if you still develop locally).

   The app sends `emailRedirectTo` using `NEXT_PUBLIC_APP_URL` when set; Supabase must allow that URL and use a matching **Site URL** so signup confirmation links complete on the live site.

2. **Authentication** → **Providers** → **Email**
   - Keep **Email** enabled (the app uses **email + password** sign-in and sign-up).
   - For local development, you can turn off “Confirm email” under **Authentication** → **Providers** → **Email** so new accounts can sign in immediately.

## D. Apply database migrations

### Option 1 — Supabase CLI (recommended)

1. Install CLI (already usable via `npx`; optional global: `npm i -g supabase`).
2. Login: `npx supabase login`
3. Link this repo to your project:  
   `npx supabase link --project-ref <YOUR_PROJECT_REF>`  
   (`Project ref` is in **Project Settings** → **General**)
4. Push migrations to the remote DB:  
   `npx supabase db push`

Migrations live in `supabase/migrations/` and run in filename order.

### Option 2 — SQL Editor (no CLI)

1. **SQL Editor** → **New query**
2. Paste and run each file **in order**:
   - `20260325000000_exchange_core.sql`
   - `20260325000001_wallets_update_policy.sql`
   - `20260325000002_profiles_insert.sql`

## E. Admin user

After you create an account (email + password on `/auth/signin`):

1. **Authentication** → **Users** → copy your user **UUID**
2. **SQL Editor**:

```sql
update public.profiles
set role = 'admin'
where id = 'YOUR_USER_UUID';
```

## F. Verify

```bash
npm run dev
```

Open [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin), sign in or sign up, complete KYC, then Exchange.

If anything fails, check the browser console and Supabase **Logs** → **Auth** / **Postgres**.

## G. Dev-only dummy users (optional)

For local smoke tests without creating a real account:

1. Set in `.env.local`:
   - `ENABLE_DEV_DUMMY_AUTH=true`
   - `NEXT_PUBLIC_ENABLE_DEV_DUMMY_AUTH=true`
   - `DEV_BYPASS_PASSWORD=<strong local password>`
2. Open `/auth/signin` and use:
   - **Login as Dev User**
   - **Login as Dev Admin**

This creates/updates test users (`dev-user@local.test`, `dev-admin@local.test`) via service role and signs in with email/password.  
Keep this disabled outside local development.
