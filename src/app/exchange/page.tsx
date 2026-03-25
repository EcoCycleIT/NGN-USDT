"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PriceTicker } from "./components/PriceTicker";
import { PriceChart } from "./components/PriceChart";
import { OrderBook } from "./components/OrderBook";
import { OrderForm } from "./components/OrderForm";
import { OpenOrders } from "./components/OpenOrders";
import { TradeHistory } from "./components/TradeHistory";
import { OrderHistory } from "./components/OrderHistory";
import { QuickTrade } from "./components/QuickTrade";
import { BalanceWidget } from "./components/BalanceWidget";
import { ActivityFeed } from "./components/ActivityFeed";

export default function ExchangePage() {
  const [refresh, setRefresh] = useState(0);

  return (
    <div className="min-h-screen bg-background pb-16 md:pb-6">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-3 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold tracking-tight">
              NGN–USDT
            </Link>
            <nav className="hidden gap-3 text-sm text-muted-foreground md:flex">
              <Link href="/exchange" className="text-foreground">
                Trade
              </Link>
              <Link href="/wallet" className="hover:text-foreground">
                Wallet
              </Link>
              <Link href="/orders" className="hover:text-foreground">
                Orders
              </Link>
              <Link href="/kyc" className="hover:text-foreground">
                KYC
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/wallet"
              className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Balances
            </Link>
            <button type="button" className="rounded-full p-2 hover:bg-muted" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </button>
            <Link href="/wallet" className="rounded-full p-2 hover:bg-muted" aria-label="Profile">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
        <div className="border-t border-border px-3 py-2">
          <PriceTicker />
        </div>
      </header>

      <main className="mx-auto grid max-w-[1600px] gap-3 p-3 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_340px_300px]">
        <div className="space-y-3">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <PriceChart />
            </CardContent>
          </Card>
          <div className="grid gap-3 md:grid-cols-2">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Order book</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderBook />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Market trades</CardTitle>
              </CardHeader>
              <CardContent>
                <TradeHistory />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-3">
          <BalanceWidget />
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Place order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickTrade onPick={() => setRefresh((x) => x + 1)} />
              <Separator />
              <OrderForm onPlaced={() => setRefresh((x) => x + 1)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Open orders</CardTitle>
            </CardHeader>
            <CardContent>
              <OpenOrders refresh={refresh} />
            </CardContent>
          </Card>
        </div>

        <div className="hidden space-y-3 xl:block">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Order history</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderHistory />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed />
            </CardContent>
          </Card>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-border bg-background/95 px-2 py-2 md:hidden">
        <Link href="/exchange" className="flex-1 py-2 text-center text-xs font-medium text-foreground">
          Trade
        </Link>
        <Link href="/wallet" className="flex-1 py-2 text-center text-xs text-muted-foreground">
          Wallet
        </Link>
        <Link href="/orders" className="flex-1 py-2 text-center text-xs text-muted-foreground">
          Orders
        </Link>
        <Link href="/kyc" className="flex-1 py-2 text-center text-xs text-muted-foreground">
          KYC
        </Link>
      </nav>
    </div>
  );
}
