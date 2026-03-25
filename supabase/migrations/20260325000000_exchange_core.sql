-- NGN-USDT Exchange — core schema, RLS, storage
-- Run in Supabase SQL Editor or via supabase db push

create extension if not exists "pgcrypto";

-- ─── Profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  bvn text,
  kyc_tier int not null default 0,
  kyc_status text not null default 'pending' check (kyc_status in ('pending', 'approved', 'rejected')),
  referral_code text unique,
  referred_by uuid references public.profiles (id),
  role text not null default 'user' check (role in ('user', 'admin', 'support')),
  withdrawal_whitelist text,
  withdrawal_whitelist_set_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_phone on public.profiles (phone);
create index if not exists idx_profiles_referral on public.profiles (referral_code);

-- ─── Wallets ───────────────────────────────────────────────────────────────
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  usdt_balance numeric(24, 8) not null default 0,
  ngn_balance numeric(24, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

-- ─── Orders ────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  side text not null check (side in ('buy', 'sell')),
  order_type text not null check (order_type in ('market', 'limit', 'stop_limit')),
  price numeric(24, 8),
  stop_price numeric(24, 8),
  limit_price numeric(24, 8),
  amount_ngn numeric(24, 2),
  amount_usdt numeric(24, 8),
  filled_usdt numeric(24, 8) not null default 0,
  filled_ngn numeric(24, 2) not null default 0,
  avg_fill_price numeric(24, 8),
  rate_locked numeric(24, 8),
  rate_lock_expires_at timestamptz,
  status text not null default 'pending' check (
    status in (
      'pending',
      'open',
      'partially_filled',
      'awaiting_payment',
      'pending_review',
      'filled',
      'cancelled',
      'rejected',
      'failed'
    )
  ),
  payment_proof_url text,
  fee_usdt numeric(24, 8) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders (user_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_open on public.orders (status, order_type)
  where status = 'open';

-- ─── Trades ────────────────────────────────────────────────────────────────
create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  price numeric(24, 8) not null,
  amount_usdt numeric(24, 8) not null,
  amount_ngn numeric(24, 2) not null,
  buyer_id uuid references auth.users (id),
  seller_id uuid references auth.users (id),
  buy_order_id uuid references public.orders (id),
  sell_order_id uuid references public.orders (id),
  taker_side text check (taker_side in ('buy', 'sell')),
  created_at timestamptz not null default now()
);

create index if not exists idx_trades_created on public.trades (created_at desc);

-- ─── Payments ─────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  reference text,
  proof_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_order on public.payments (order_id);

-- ─── Price alerts ─────────────────────────────────────────────────────────
create table if not exists public.price_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  target_price numeric(24, 8) not null,
  direction text not null check (direction in ('above', 'below')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── Referrals ────────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users (id) on delete cascade,
  referee_id uuid not null references auth.users (id) on delete cascade,
  reward_ngn numeric(24, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (referee_id)
);

-- ─── Withdrawals ───────────────────────────────────────────────────────────
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_usdt numeric(24, 8) not null,
  destination_address text not null,
  status text not null default 'pending' check (
    status in ('pending', 'processing', 'completed', 'rejected')
  ),
  whitelist_hold_until timestamptz,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ─── Audit logs (admin) ────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id),
  action text not null,
  entity_type text,
  entity_id uuid,
  meta jsonb,
  created_at timestamptz not null default now()
);

-- ─── Order book cache (optional realtime) ─────────────────────────────────
create table if not exists public.order_book_levels (
  id uuid primary key default gen_random_uuid(),
  side text not null check (side in ('bid', 'ask')),
  price numeric(24, 8) not null,
  amount_usdt numeric(24, 8) not null,
  source text not null default 'synthetic',
  updated_at timestamptz not null default now()
);

-- ─── Triggers: updated_at ─────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_wallets_updated on public.wallets;
create trigger trg_wallets_updated
  before update on public.wallets
  for each row execute procedure public.set_updated_at();

drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- ─── New user: profile + wallet + referral code ──────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
declare
  code text;
begin
  code := upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
  insert into public.profiles (id, phone, referral_code)
  values (new.id, coalesce(new.phone, new.raw_user_meta_data->>'phone'), code);
  insert into public.wallets (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── RLS ───────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.orders enable row level security;
alter table public.trades enable row level security;
alter table public.payments enable row level security;
alter table public.price_alerts enable row level security;
alter table public.referrals enable row level security;
alter table public.withdrawals enable row level security;
alter table public.audit_logs enable row level security;
alter table public.order_book_levels enable row level security;

-- Profiles
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Wallets
create policy "wallets_select_own"
  on public.wallets for select
  using (auth.uid() = user_id);

-- Orders
create policy "orders_select_own"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "orders_insert_own"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "orders_update_own"
  on public.orders for update
  using (auth.uid() = user_id);

-- Trades: users see trades they participated in
create policy "trades_select_participant"
  on public.trades for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

-- Payments
create policy "payments_select_own"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "payments_insert_own"
  on public.payments for insert
  with check (auth.uid() = user_id);

-- Price alerts
create policy "price_alerts_all_own"
  on public.price_alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Referrals
create policy "referrals_select_own"
  on public.referrals for select
  using (auth.uid() = referrer_id or auth.uid() = referee_id);

-- Withdrawals
create policy "withdrawals_all_own"
  on public.withdrawals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Audit logs: no user access (service role only)
create policy "audit_deny_all"
  on public.audit_logs for select
  using (false);

-- Order book levels: public read
create policy "order_book_read"
  on public.order_book_levels for select
  to authenticated, anon
  using (true);

-- Create storage bucket `payment-proofs` in Supabase Dashboard if using Storage uploads.
-- Note: Admin operations use service role key in API routes (bypasses RLS).
