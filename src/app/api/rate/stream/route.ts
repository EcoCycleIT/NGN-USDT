import { getNgnUsdtRate } from "@/lib/rate-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const tick = async () => {
        try {
          const rate = await getNgnUsdtRate();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(rate)}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`data: {}\n\n`));
        }
      };
      await tick();
      interval = setInterval(tick, 3000);
    },
    cancel() {
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
