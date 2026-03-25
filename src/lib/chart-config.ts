import { ColorType } from "lightweight-charts";

/** Lightweight Charts v5 — partial options for dark theme */
export const chartLayout = {
  layout: {
    background: { type: ColorType.Solid, color: "#0c0c0f" },
    textColor: "#a1a1aa",
  },
  grid: {
    vertLines: { color: "rgba(255,255,255,0.06)" },
    horzLines: { color: "rgba(255,255,255,0.06)" },
  },
  crosshair: {
    mode: 1,
  },
  rightPriceScale: {
    borderColor: "rgba(255,255,255,0.1)",
  },
  timeScale: {
    borderColor: "rgba(255,255,255,0.1)",
    timeVisible: true,
    secondsVisible: false,
  },
} as const;

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

export const timeframeToInterval: Record<Timeframe, string> = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
  "1w": "1w",
};

/** Binance klines interval mapping */
export function binanceInterval(tf: Timeframe): string {
  const map: Record<Timeframe, string> = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "1h": "1h",
    "4h": "4h",
    "1d": "1d",
    "1w": "1w",
  };
  return map[tf];
}
