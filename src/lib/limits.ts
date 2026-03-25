/** Tier-based daily limits (NGN) — MVP static */
const TIER_LIMITS: Record<number, number> = {
  0: 0,
  1: 100_000,
  2: 1_000_000,
  3: Number.MAX_SAFE_INTEGER,
};

export function dailyNgnLimitForTier(tier: number): number {
  return TIER_LIMITS[tier] ?? TIER_LIMITS[0];
}

export function canTradeAmount(ngnAmount: number, tier: number): boolean {
  return ngnAmount <= dailyNgnLimitForTier(tier);
}
