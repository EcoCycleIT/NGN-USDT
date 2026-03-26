type Role = "user" | "admin";
type Kyc = { tier: number; status: "approved" | "pending" | "rejected"; role: Role };
type Wallet = { usdt: number; ngn: number };
type Order = {
  id: string;
  user_id: string;
  side: "buy" | "sell";
  order_type: "market" | "limit" | "stop_limit";
  amount_ngn: number;
  amount_usdt: number;
  rate_locked: number;
  status: string;
  payment_proof_url?: string;
  fee_usdt: number;
  created_at: string;
};

type Store = {
  orders: Order[];
  wallets: Record<string, Wallet>;
  profiles: Record<string, Kyc>;
};

const g = globalThis as unknown as { __devStore?: Store };
if (!g.__devStore) g.__devStore = { orders: [], wallets: {}, profiles: {} };
const store = g.__devStore;

export function devFallbackEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_DUMMY_AUTH === "true";
}

export function isMissingSchemaError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  return !!e && (e.code === "PGRST205" || e.code === "42P01" || e.message?.includes("schema cache") === true);
}

export function ensureDevUser(userId: string, role: Role = "user") {
  if (!store.profiles[userId]) store.profiles[userId] = { tier: 1, status: "approved", role };
  if (!store.wallets[userId]) store.wallets[userId] = { usdt: role === "user" ? 1500 : 0, ngn: 250000 };
}

export function setDevRole(userId: string, role: Role) {
  ensureDevUser(userId, role);
  store.profiles[userId].role = role;
}

export function getDevProfile(userId: string) {
  ensureDevUser(userId, "user");
  return store.profiles[userId];
}

export function getDevWallet(userId: string) {
  ensureDevUser(userId, "user");
  return store.wallets[userId];
}

export function listDevOrdersForUser(userId: string) {
  return store.orders.filter((o) => o.user_id === userId).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function createDevOrder(input: Omit<Order, "id" | "created_at">) {
  const id = crypto.randomUUID();
  const order: Order = { ...input, id, created_at: new Date().toISOString() };
  store.orders.push(order);
  return order;
}

export function getDevOrder(userId: string, id: string) {
  return store.orders.find((o) => o.id === id && o.user_id === userId) ?? null;
}

export function updateDevOrder(userId: string, id: string, patch: Partial<Order>) {
  const idx = store.orders.findIndex((o) => o.id === id && o.user_id === userId);
  if (idx < 0) return null;
  store.orders[idx] = { ...store.orders[idx], ...patch };
  return store.orders[idx];
}

export function listDevPendingForAdmin() {
  return store.orders
    .filter((o) => o.status === "awaiting_payment" || o.status === "pending_review")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function adminApproveBuy(orderId: string) {
  const o = store.orders.find(
    (x) => x.id === orderId && x.side === "buy" && (x.status === "awaiting_payment" || x.status === "pending_review"),
  );
  if (!o) return null;
  o.status = "filled";
  ensureDevUser(o.user_id, "user");
  store.wallets[o.user_id].usdt += Math.max(0, o.amount_usdt - o.fee_usdt);
  return o;
}

export function adminReject(orderId: string) {
  const o = store.orders.find((x) => x.id === orderId);
  if (!o) return null;
  o.status = "rejected";
  return o;
}

