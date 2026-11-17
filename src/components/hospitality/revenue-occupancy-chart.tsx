"use client";

import React, { useMemo, useState } from "react";
import { formatMoney } from "@/lib/utils";
import type { Reservation } from "@/types/domain";

interface MonthlyBucket {
  key: string;
  label: string;
  revenue: number;
  count: number;
}

export function RevenueOccupancyChart({
  reservations,
}: {
  reservations: Reservation[];
}) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const buckets = useMemo<MonthlyBucket[]>(() => {
    const now = new Date();
    const result: MonthlyBucket[] = [];

    // Build last 6 calendar months ending in current month
    for (let offset = 5; offset >= 0; offset--) {
      const d = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1)
      );
      const year = d.getUTCFullYear();
      const month = d.getUTCMonth();
      const key = `${year}-${String(month + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
      result.push({ key, label, revenue: 0, count: 0 });
    }

    const bucketMap = new Map(result.map((b) => [b.key, b]));

    for (const r of reservations) {
      if (r.status === "Cancelled") continue;
      // @defect VH-18 (Hard | Dashboard / chart | Functional)
      // Expected: Group reservations by browser local calendar month (Asia/Manila).
      // Actual: Groups by UTC year and UTC month, causing a reservation placed at 12:30 AM local time on the 1st to land in the prior month's bar.
      const d = new Date(r.placedAt);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const bucket = bucketMap.get(key);
      if (bucket) {
        bucket.revenue += r.grandTotal;
        bucket.count += 1;
      }
    }

    return result;
  }, [reservations]);

  const maxRevenue = Math.max(1, ...buckets.map((b) => b.revenue));
  const activeBucket = buckets.find((b) => b.key === hoveredKey) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 min-h-[28px]">
        <div className="text-xs text-[var(--ink-muted)]">
          Hover a bar to inspect monthly non-cancelled revenue and reservations
        </div>
        {activeBucket && (
          <div
            data-testid="chart-hover-tooltip"
            className="inline-flex items-center gap-3 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-3 py-1 text-xs"
          >
            <span className="font-semibold text-[var(--ink-primary)]">
              {activeBucket.label}
            </span>
            <span className="font-mono-tabular text-[var(--accent-primary)]">
              PHP {formatMoney(activeBucket.revenue)}
            </span>
            <span
              className="font-mono-tabular text-[var(--ink-secondary)]"
              data-testid="chart-tooltip-count"
            >
              {" "}
              {activeBucket.count} reservations
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-6 gap-3 sm:gap-5 items-end h-52 pt-4 px-2 border-b border-[var(--border-subtle)]">
        {buckets.map((bucket) => {
          const heightPct = Math.max(
            6,
            Math.round((bucket.revenue / maxRevenue) * 100)
          );
          const isHovered = hoveredKey === bucket.key;
          return (
            <div
              key={bucket.key}
              data-testid={`chart-bar-${bucket.key}`}
              onMouseEnter={() => setHoveredKey(bucket.key)}
              onMouseLeave={() => setHoveredKey(null)}
              className="flex flex-col items-center justify-end h-full gap-2 cursor-pointer group"
            >
              <span className="font-mono-tabular text-[11px] text-[var(--ink-muted)] group-hover:text-[var(--ink-primary)]">
                {bucket.count}
              </span>
              <div className="w-full max-w-[54px] flex-1 flex items-end">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-lg transition-all ${
                    isHovered
                      ? "bg-[var(--accent-primary)]"
                      : "bg-[var(--accent-secondary)]/85"
                  }`}
                />
              </div>
              <span className="text-[11px] font-medium text-[var(--ink-secondary)] pb-2 text-center">
                {bucket.label.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
