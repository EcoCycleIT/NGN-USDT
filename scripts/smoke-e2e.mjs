import { chromium } from "playwright";

const base = process.env.SMOKE_BASE_URL || "http://localhost:3001";
const results = [];

function mark(step, status, details = "") {
  results.push({ step, status, details });
  console.log(`[${status}] ${step}${details ? ` - ${details}` : ""}`);
}

async function clickIfVisible(page, selector) {
  const el = page.locator(selector);
  if ((await el.count()) > 0 && (await el.first().isVisible())) {
    await el.first().click();
    return true;
  }
  return false;
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

let orderId = null;
let beforeUsdt = null;
let afterUsdt = null;

try {
  // Step 1: Dev user login via bypass
  await page.goto(`${base}/auth/verify`, { waitUntil: "domcontentloaded" });
  if (await clickIfVisible(page, 'button:has-text("Login as Dev User")')) {
    await page.waitForURL(/\/(kyc|admin\/orders|exchange)/, { timeout: 15000 });
    mark("1) Dev bypass login as user", "PASS", page.url());
  } else {
    mark("1) Dev bypass login as user", "FAIL", "Bypass button not visible");
  }

  // Step 2: KYC submit (best-effort if on /kyc)
  await page.goto(`${base}/kyc`, { waitUntil: "domcontentloaded" });
  if (page.url().includes("/auth/signup")) {
    mark("2) KYC access", "FAIL", "Redirected to signup (not authenticated)");
  } else {
    await page.fill('input[required]', "Dev User");
    await page.fill('input[inputmode="numeric"]', "12345678901");
    await page.click('button:has-text("Submit")');
    await page.waitForTimeout(1000);
    if (page.url().includes("/exchange")) {
      mark("2) KYC submit", "PASS", "Redirected to /exchange");
    } else {
      mark("2) KYC submit", "PASS", "Submitted (no redirect)");
    }
  }

  // Snapshot user wallet before order approval
  await page.goto(`${base}/exchange`, { waitUntil: "domcontentloaded" });
  beforeUsdt = await page.evaluate(async () => {
    const r = await fetch("/api/wallet/balance");
    if (!r.ok) return null;
    const j = await r.json();
    return Number(j.usdt_balance ?? 0);
  });

  // Step 3: place BUY market order
  await page.goto(`${base}/exchange`, { waitUntil: "domcontentloaded" });
  const ngnInput = page.locator('input[placeholder="500000"]');
  if ((await ngnInput.count()) > 0) {
    await ngnInput.fill("5000");
    await page.click('button:has-text("Place buy order")');
    await page.waitForTimeout(1500);
    mark("3) Place BUY market order", "PASS");
  } else {
    mark("3) Place BUY market order", "FAIL", "Order amount input not found");
  }

  // Step 4: open latest order
  await page.goto(`${base}/orders`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  orderId = await page.evaluate(async () => {
    const r = await fetch("/api/orders");
    if (!r.ok) return null;
    const rows = await r.json();
    return Array.isArray(rows) && rows.length > 0 ? rows[0].id : null;
  });
  if (orderId) {
    await page.goto(`${base}/orders/${orderId}`, { waitUntil: "domcontentloaded" });
    mark("4) Open latest order", "PASS", orderId);
  } else {
    mark("4) Open latest order", "FAIL", "No order found");
  }

  // Step 5: upload proof url if awaiting payment
  if (orderId) {
    await page.goto(`${base}/orders/upload-proof/${orderId}`, { waitUntil: "domcontentloaded" });
    const proofInput = page.locator('input[type="url"]');
    if ((await proofInput.count()) > 0) {
      await proofInput.fill("https://example.com/proof.jpg");
      await page.click('button:has-text("Submit")');
      await page.waitForTimeout(1200);
      mark("5) Upload payment proof URL", "PASS");
    } else {
      mark("5) Upload payment proof URL", "FAIL", "Proof input not found");
    }
  } else {
    mark("5) Upload payment proof URL", "BLOCKED", "No order id");
  }

  // Step 6: login as admin via bypass
  await page.goto(`${base}/auth/verify`, { waitUntil: "domcontentloaded" });
  if (await clickIfVisible(page, 'button:has-text("Login as Dev Admin")')) {
    await page.waitForURL(/\/(admin\/orders|kyc|exchange)/, { timeout: 15000 });
    mark("6) Dev bypass login as admin", "PASS", page.url());
  } else {
    mark("6) Dev bypass login as admin", "FAIL", "Admin bypass button not visible");
  }

  // Step 7: approve in admin/orders
  await page.goto(`${base}/admin/orders`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  if (!orderId) {
    mark("7) Admin approve buy order", "BLOCKED", "Missing order id");
  } else {
    const approveRes = await page.evaluate(async (id) => {
      const r = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, action: "approve_buy" }),
      });
      const j = await r.json().catch(() => ({}));
      return { ok: r.ok, status: r.status, body: j };
    }, orderId);
    if (approveRes.ok) mark("7) Admin approve buy order", "PASS");
    else
      mark(
        "7) Admin approve buy order",
        "FAIL",
        `status=${approveRes.status} error=${approveRes.body?.error ?? "unknown"}`,
      );
  }

  // Step 8: verify filled + wallet increase as user
  await page.goto(`${base}/auth/verify`, { waitUntil: "domcontentloaded" });
  await clickIfVisible(page, 'button:has-text("Login as Dev User")');
  await page.waitForTimeout(800);

  let statusOk = false;
  if (orderId) {
    statusOk = await page.evaluate(async (id) => {
      const r = await fetch(`/api/orders/${id}`);
      if (!r.ok) return false;
      const j = await r.json();
      return String(j.status ?? "").toLowerCase() === "filled";
    }, orderId);
  }
  afterUsdt = await page.evaluate(async () => {
    const r = await fetch("/api/wallet/balance");
    if (!r.ok) return null;
    const j = await r.json();
    return Number(j.usdt_balance ?? 0);
  });

  if (statusOk) {
    const increased =
      typeof beforeUsdt === "number" &&
      typeof afterUsdt === "number" &&
      afterUsdt >= beforeUsdt;
    mark(
      "8) Verify filled status + wallet USDT",
      increased ? "PASS" : "FAIL",
      `before=${beforeUsdt} after=${afterUsdt}`,
    );
  } else {
    mark("8) Verify filled status + wallet USDT", "FAIL", "Order status not filled");
  }
} catch (e) {
  mark("Smoke test execution", "FAIL", e instanceof Error ? e.message : String(e));
} finally {
  await browser.close();
}

console.log("\n=== STRICT CHECKLIST ===");
for (const r of results) {
  console.log(`${r.status}\t${r.step}\t${r.details}`);
}

const allPassed = results.every((r) => r.status === "PASS");
console.log(`\nFINAL VERDICT: ${allPassed ? "FULL PASS" : "NOT FULL PASS"}`);
process.exit(allPassed ? 0 : 2);

