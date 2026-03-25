import { feeUsdtFromNotional } from "@/lib/fees";
import { getNgnUsdtRate } from "@/lib/rate-engine";

export type MatchResult = {
  orderId: string;
  status: string;
  executedPrice: number;
  amountUsdt: number;
  amountNgn: number;
  feeUsdt: number;
  awaitingPayment?: boolean;
};

/** Derive USDT notional and NGN leg from inputs */
export async function quoteMarketBuy(amountNgn?: number, amountUsdt?: number) {
  const rate = await getNgnUsdtRate();
  const p = rate.ngnPerUsdt;
  if (amountNgn != null && amountNgn > 0) {
    const usdt = amountNgn / p;
    return { ngn: amountNgn, usdt, price: p, rate };
  }
  if (amountUsdt != null && amountUsdt > 0) {
    const ngn = amountUsdt * p;
    return { ngn, usdt: amountUsdt, price: p, rate };
  }
  throw new Error("Provide amountNgn or amountUsdt");
}

export async function quoteMarketSell(amountUsdt: number) {
  const rate = await getNgnUsdtRate();
  const p = rate.ngnPerUsdt;
  const ngn = amountUsdt * p;
  return { ngn, usdt: amountUsdt, price: p, rate };
}

export function computeFeeUsdt(notionalUsdt: number): number {
  return feeUsdtFromNotional(notionalUsdt);
}
