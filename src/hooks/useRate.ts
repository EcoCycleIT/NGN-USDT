"use client";

import { useEffect, useState } from "react";
import type { RateSnapshot } from "@/lib/rate-engine";

export function useRate(pollMs = 5000) {
  const [rate, setRate] = useState<RateSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | undefined;

    try {
      es = new EventSource("/api/rate/stream");
      es.onmessage = (ev) => {
        try {
          setRate(JSON.parse(ev.data) as RateSnapshot);
          setError(null);
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => {
        es?.close();
        es = null;
        poll = setInterval(async () => {
          const r = await fetch("/api/rate");
          if (r.ok) setRate(await r.json());
        }, pollMs);
      };
    } catch {
      poll = setInterval(async () => {
        const r = await fetch("/api/rate");
        if (r.ok) {
          setRate(await r.json());
          setError(null);
        } else setError("Rate unavailable");
      }, pollMs);
    }

    return () => {
      es?.close();
      if (poll) clearInterval(poll);
    };
  }, [pollMs]);

  return { rate, error };
}
