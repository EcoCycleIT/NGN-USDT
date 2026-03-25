/**
 * Browser helper: multiplex EventSource (rates) + optional Supabase Realtime.
 * Next.js Route Handlers use SSE instead of raw WebSockets for edge compatibility.
 */

export type StreamHandlers = {
  onRate?: (payload: unknown) => void;
  onError?: (e: Event) => void;
};

export function openRateStream(handlers: StreamHandlers): () => void {
  if (typeof window === "undefined") return () => {};
  const es = new EventSource("/api/rate/stream");
  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      handlers.onRate?.(data);
    } catch {
      /* ignore */
    }
  };
  es.onerror = handlers.onError ?? (() => {});
  return () => es.close();
}
