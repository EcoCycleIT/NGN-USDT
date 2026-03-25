"use client";

import { useEffect } from "react";
import { openRateStream } from "@/lib/websocket";

/** Thin wrapper — prefer `useRate` for React; this mirrors the spec hook name */
export function useWebSocketRate(onData: (data: unknown) => void) {
  useEffect(() => {
    return openRateStream({ onRate: onData });
  }, [onData]);
}
