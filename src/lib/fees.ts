/** Platform fee (taker) — MVP flat bps on USDT notional */
const FEE_BPS = 25; // 0.25%

export function feeUsdtFromNotional(notionalUsdt: number): number {
  if (!Number.isFinite(notionalUsdt) || notionalUsdt <= 0) return 0;
  return Math.round(notionalUsdt * (FEE_BPS / 10_000) * 1e6) / 1e6;
}

export function feeBps(): number {
  return FEE_BPS;
}
