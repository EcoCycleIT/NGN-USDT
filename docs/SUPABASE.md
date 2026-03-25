# Configure Supabase for NGN–USDT Exchange

Do this once per Supabase project.

## A. Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
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

## C. Auth URLs (required for phone OTP + callback)

1. **Authentication** → **URL Configuration**
   - **Site URL**: `http://localhost:3000` (production: your real domain)
   - **Redirect URLs**: add  
     `http://localhost:3000/auth/callback`  
     (and your production callback URL when you deploy)

2. **Authentication** → **Providers** → **Phone**
   - Enable **Phone provider**
   - Configure your SMS provider (Twilio, MessageBird, etc.) per Supabase docs  
  - For Twilio, configure:
    - `SUPABASE_AUTH_SMS_TWILIO_ACCOUNT_SID`
    - `SUPABASE_AUTH_SMS_TWILIO_MESSAGE_SERVICE_SID`
    - `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN`
  - Push auth config to hosted Supabase after linking:
    - `npx supabase config push --project-ref <YOUR_PROJECT_REF>`
   - For **local testing**, Supabase can use [test OTP](https://supabase.com/docs/guides/auth/phone-login#testing) depending on your plan/settings

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

After you sign up once with phone OTP:

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

Open [http://localhost:3000/auth/signup](http://localhost:3000/auth/signup), complete OTP, KYC, then Exchange.

If anything fails, check the browser console and Supabase **Logs** → **Auth** / **Postgres**.

## G. Dev-only OTP bypass (optional)

For local smoke tests without SMS delivery:

1. Set in `.env.local`:
   - `ENABLE_DEV_OTP_BYPASS=true`
   - `NEXT_PUBLIC_ENABLE_DEV_OTP_BYPASS=true`
   - `DEV_BYPASS_PASSWORD=<strong local password>`
2. Open `/auth/verify` and use:
   - **Login as Dev User**
   - **Login as Dev Admin**

This creates/updates test users (`dev-user@local.test`, `dev-admin@local.test`) via service role and signs in with email/password.
Keep this disabled outside local development.

