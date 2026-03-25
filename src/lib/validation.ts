import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(10)
  .transform((s) => s.replace(/\s/g, ""))
  .refine((s) => /^\+?[1-9]\d{9,14}$/.test(s), "Invalid phone");

export const bvnSchema = z.string().regex(/^\d{11}$/, "BVN must be 11 digits");

export const orderCreateSchema = z.object({
  side: z.enum(["buy", "sell"]),
  orderType: z.enum(["market", "limit", "stop_limit"]),
  amountNgn: z.number().positive().optional(),
  amountUsdt: z.number().positive().optional(),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  limitPrice: z.number().positive().optional(),
});

export const proofUrlSchema = z.object({
  proofUrl: z.string().url(),
});

export const withdrawalSchema = z.object({
  amountUsdt: z.number().positive(),
  destinationAddress: z.string().min(20).max(64),
});

export const priceAlertSchema = z.object({
  targetPrice: z.number().positive(),
  direction: z.enum(["above", "below"]),
});
