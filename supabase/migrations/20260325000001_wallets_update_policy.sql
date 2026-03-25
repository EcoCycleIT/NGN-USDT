-- Allow users to update their own wallet row (balance mutations also use service role in APIs)
create policy "wallets_update_own"
  on public.wallets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
