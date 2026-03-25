"use client";

import { Button } from "@/components/ui/button";

const PRESETS = [5000, 10000, 50000, 100000];

export function QuickTrade({
  onPick,
}: {
  onPick: (ngn: number) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {PRESETS.map((n) => (
        <Button
          key={n}
          type="button"
          variant="secondary"
          size="sm"
          className="text-[10px]"
          onClick={() => onPick(n)}
        >
          ₦{(n / 1000).toFixed(0)}k
        </Button>
      ))}
    </div>
  );
}
