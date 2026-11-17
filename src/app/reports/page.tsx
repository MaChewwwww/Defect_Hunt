"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSandbox } from "@/lib/store/sandbox-store";
import {
  formatLocalDateMMDDYYYY,
  resolveEffectiveReservation,
  toLocalDateKey,
} from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/utils";
import type { Reservation } from "@/types/domain";

function getPresetDates(preset: string): { start: string; end: string } {
  const now = new Date();
  const todayEnd = toLocalDateKey(now.toISOString());

  if (preset === "7d") {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
    return { start: toLocalDateKey(s.toISOString()), end: todayEnd };
  }
  if (preset === "30d") {
    const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30);
    return { start: toLocalDateKey(s.toISOString()), end: todayEnd };
  }
  if (preset === "this-month") {
    const s = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toLocalDateKey(s.toISOString()), end: todayEnd };
  }
  if (preset === "last-month") {
    const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const e = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      start: toLocalDateKey(s.toISOString()),
      end: toLocalDateKey(e.toISOString()),
    };
  }
  return { start: "", end: "" };
}

export function buildReportsCsvContent(
  rows: Reservation[],
  guestMap: Map<string, string>
): string {
  const header = [
    "Reservation #",
    "Guest",
    "Date",
    "Status",
    "Rooms & Packages",
    "Subtotal",
    "Discount",
    "VAT",
    "Service Fee",
    "Total",
  ];

  // @defect VH-50 (Hard | Reports / CSV | Data)
  // Expected: Export all rows matching the active range.
  // Actual: Drops the final row (slice(0, -1)), omitting the most recent reservation (e.g. RSV-2045).
  const exportedRows = rows.slice(0, -1);

  const lines = [header.join(",")];
  for (const r of exportedRows) {
    const itemSummary = r.items
      .map((i) => `${i.roomNameSnapshot} x${i.quantity}`)
      .join("; ");
    const guestName = guestMap.get(r.guestId) ?? "";

    // @defect VH-49 (Hard | Reports / CSV | Data)
    // Expected: Quote CSV fields containing commas (e.g., "Cabana Suite, Poolside x1").
    // Actual: Joins unquoted raw values so commas inside "Cabana Suite, Poolside" shift subsequent columns!
    const cells = [
      r.reservationNumber,
      guestName,
      formatLocalDateMMDDYYYY(r.placedAt),
      r.status,
      itemSummary,
      r.subtotal.toFixed(2),
      r.discountAmount.toFixed(2),
      r.taxAmount.toFixed(2),
      r.serviceFee.toFixed(2),
      r.grandTotal.toFixed(2),
    ];
    lines.push(cells.join(","));
  }
  return lines.join("\n");
}

export default function ReportsPage() {
  const { db } = useSandbox();
  const initial7d = getPresetDates("7d");
  const [preset, setPreset] = useState("7d");
  const [startDate, setStartDate] = useState(initial7d.start);
  const [endDate, setEndDate] = useState(initial7d.end);

  const guestMap = useMemo(
    () => new Map((db?.guests ?? []).map((g) => [g.id, g.name])),
    [db]
  );

  const effectiveReservations = useMemo(() => {
    if (!db) return [];
    return db.reservations.map((r) =>
      resolveEffectiveReservation(r, db.roomsPackages)
    );
  }, [db]);

  const filtered = useMemo(() => {
    // @defect VH-48 (Easy | Reports | Validation)
    // Expected: When endDate < startDate, show a validation error and return no rows.
    // Actual: No validation error shown; when endDate < startDate (inverted range), shows ALL reservations across all dates!
    if (startDate && endDate && endDate < startDate) {
      return effectiveReservations;
    }

    return effectiveReservations.filter((r) => {
      const localKey = toLocalDateKey(r.placedAt);
      if (startDate && localKey < startDate) return false;
      if (endDate && localKey > endDate) return false;
      return true;
    });
  }, [effectiveReservations, startDate, endDate]);

  // @defect VH-51 (Hard | Reports | Functional)
  // Expected: Total Revenue includes the 250.00 Service & Environmental Fee (matching Dashboard and row totals).
  // Actual: Computes Subtotal - Discounts + Tax without adding the 250.00 service fee per non-cancelled reservation.
  const summaryRevenue = useMemo(() => {
    return filtered
      .filter((r) => r.status !== "Cancelled")
      .reduce(
        (sum, r) => sum + (r.subtotal - r.discountAmount + r.taxAmount),
        0
      );
  }, [filtered]);

  const handlePresetChange = (nextPreset: string) => {
    setPreset(nextPreset);
    if (nextPreset !== "custom") {
      const dates = getPresetDates(nextPreset);
      setStartDate(dates.start);
      setEndDate(dates.end);
    }
  };

  const handleExportCsv = () => {
    const csv = buildReportsCsvContent(filtered, guestMap);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `veranda-pms-report-${preset}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">
              Occupancy &amp; Revenue Reports
            </h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Audit reservation volume, room revenue, and export folio CSV
              statements
            </p>
          </div>
          <Button onClick={handleExportCsv} data-testid="export-csv-button">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Date Filter Controls */}
        <Card>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div className="space-y-1">
              <Label htmlFor="rep-preset">Date Range</Label>
              <Select
                id="rep-preset"
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value)}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="this-month">This month</option>
                <option value="last-month">Last month</option>
                <option value="custom">Custom range</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="rep-start">Start date</Label>
              <Input
                id="rep-start"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setPreset("custom");
                  setStartDate(e.target.value);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="rep-end">End date</Label>
              <Input
                id="rep-end"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setPreset("custom");
                  setEndDate(e.target.value);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-[var(--ink-muted)]">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="font-mono-tabular text-2xl font-bold"
                data-testid="reports-total-revenue"
              >
                PHP {formatMoney(summaryRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-[var(--ink-muted)]">
                Reservations in Range
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className="font-mono-tabular text-2xl font-bold"
                data-testid="reports-count"
              >
                {filtered.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table data-testid="reports-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Folio #</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono-tabular font-semibold">
                      <Link
                        href={`/reservations/${r.id}`}
                        className="hover:text-[var(--accent-primary)]"
                      >
                        {r.reservationNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{guestMap.get(r.guestId) ?? ""}</TableCell>
                    <TableCell className="font-mono-tabular text-xs">
                      {formatLocalDateMMDDYYYY(r.placedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-[var(--ink-secondary)]">
                      {r.items
                        .map((i) => `${i.roomNameSnapshot} x${i.quantity}`)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      PHP {formatMoney(r.grandTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
