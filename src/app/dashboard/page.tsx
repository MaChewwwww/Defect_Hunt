"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck2,
  CircleDollarSign,
  TrendingUp,
} from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { RevenueOccupancyChart } from "@/components/hospitality/revenue-occupancy-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
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
  LOW_ALLOTMENT_THRESHOLD,
  resolveEffectiveReservation,
} from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/utils";

type DashboardRange = "7d" | "30d" | "90d" | "all";

export default function DashboardPage() {
  const { db, session } = useSandbox();
  const [range, setRange] = useState<DashboardRange>("30d");

  const effectiveReservations = useMemo(() => {
    if (!db) return [];
    return db.reservations.map((r) =>
      resolveEffectiveReservation(r, db.roomsPackages)
    );
  }, [db]);

  const filteredReservations = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    );

    if (range === "all") return effectiveReservations;

    if (range === "7d") {
      // @defect VH-19 (Medium | Dashboard | Functional)
      // Expected: "Last 7 days" includes reservations placed today.
      // Actual: Range ends at todayStart (yesterday 23:59:59), excluding today's reservations!
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 7);
      return effectiveReservations.filter((r) => {
        const d = new Date(r.placedAt);
        return d >= start && d < todayStart;
      });
    }

    const days = range === "30d" ? 30 : 90;
    const start = new Date(todayStart);
    start.setDate(start.getDate() - days);
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    );
    return effectiveReservations.filter((r) => {
      const d = new Date(r.placedAt);
      return d >= start && d <= todayEnd;
    });
  }, [effectiveReservations, range]);

  const kpis = useMemo(() => {
    // @defect VH-16 (Medium | Dashboard | Functional)
    // Expected: Exclude Cancelled reservations from Total Revenue.
    // Actual: Sums grandTotal across ALL reservations in range, including Cancelled ones.
    const totalRevenue = filteredReservations.reduce(
      (sum, r) => sum + r.grandTotal,
      0
    );

    const nonCancelled = filteredReservations.filter(
      (r) => r.status !== "Cancelled"
    );
    const nonCancelledRevenue = nonCancelled.reduce(
      (sum, r) => sum + r.grandTotal,
      0
    );

    // @defect VH-20 (Hard | Dashboard | Functional)
    // Expected: Average Booking Value = nonCancelledRevenue / nonCancelled.length.
    // Actual: Divides nonCancelledRevenue by filteredReservations.length (including Cancelled), lowering ABV.
    const abv =
      filteredReservations.length > 0
        ? nonCancelledRevenue / filteredReservations.length
        : 0;

    return {
      totalRevenue,
      reservationCount: filteredReservations.length,
      abv,
    };
  }, [filteredReservations]);

  const rooms = useMemo(() => db?.roomsPackages ?? [], [db]);

  // @defect VH-17 (Hard | Dashboard | Functional)
  // Expected: Both Low Allotment KPI and Low Allotment Watchlist use availableUnits <= 5.
  // Actual: KPI uses <= 5 (8 items), while Watchlist uses < 5 (7 rows, omitting Coral Reef Private Cabana with 5).
  const lowAllotmentKpiCount = useMemo(
    () =>
      rooms.filter((r) => r.availableUnits <= LOW_ALLOTMENT_THRESHOLD).length,
    [rooms]
  );

  const lowAllotmentList = useMemo(
    () => rooms.filter((r) => r.availableUnits < LOW_ALLOTMENT_THRESHOLD),
    [rooms]
  );

  const guestMap = useMemo(
    () => new Map((db?.guests ?? []).map((g) => [g.id, g])),
    [db]
  );

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl" data-testid="dashboard-greeting">
              Welcome back, {session?.name}
            </h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Solstice Bay Resort &amp; Villas live occupancy, folio revenue, and
              allotment overview
            </p>
          </div>
          <div className="w-48">
            <Select
              aria-label="Dashboard period"
              data-testid="dashboard-range-select"
              value={range}
              onChange={(e) => setRange(e.target.value as DashboardRange)}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Total Revenue
              </CardTitle>
              <CircleDollarSign className="h-4 w-4 text-[var(--accent-primary)]" />
            </CardHeader>
            <CardContent>
              <div
                className="font-mono-tabular text-2xl font-bold"
                data-testid="kpi-total-revenue"
              >
                PHP {formatMoney(kpis.totalRevenue)}
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Gross folio billings in period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Reservations
              </CardTitle>
              <CalendarCheck2 className="h-4 w-4 text-[var(--accent-secondary)]" />
            </CardHeader>
            <CardContent>
              <div
                className="font-mono-tabular text-2xl font-bold"
                data-testid="kpi-reservations-count"
              >
                {kpis.reservationCount}
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Bookings in selected window
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Average Booking Value
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-[var(--accent-secondary)]" />
            </CardHeader>
            <CardContent>
              <div
                className="font-mono-tabular text-2xl font-bold"
                data-testid="kpi-abv"
              >
                PHP {formatMoney(kpis.abv)}
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Per reservation folio average
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)]">
                Low Allotment
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-[var(--status-warn-fg)]" />
            </CardHeader>
            <CardContent>
              <div
                className="font-mono-tabular text-2xl font-bold"
                data-testid="kpi-low-allotment"
              >
                {lowAllotmentKpiCount}
              </div>
              <p className="text-xs text-[var(--ink-muted)] mt-1">
                Rooms &amp; packages with &lt;= 5 units
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart & Low Allotment Watchlist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Monthly Folio Revenue &amp; Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueOccupancyChart reservations={effectiveReservations} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Low Allotment Watchlist</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table data-testid="low-allotment-watchlist">
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Room / Package</TableHead>
                    <TableHead className="text-right">Units</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowAllotmentList.map((room) => (
                    <TableRow key={room.id} data-testid={`low-row-${room.code}`}>
                      <TableCell className="font-mono-tabular text-xs">
                        {room.code}
                      </TableCell>
                      <TableCell className="text-xs font-medium max-w-[180px] truncate">
                        <Link
                          href={`/rooms/${room.id}`}
                          className="hover:text-[var(--accent-primary)]"
                        >
                          {room.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        <Badge
                          variant={
                            room.availableUnits <= 0 ? "danger" : "warning"
                          }
                        >
                          {room.availableUnits}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Recent Reservations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Reservations</CardTitle>
            <Link
              href="/reservations"
              className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
            >
              View all reservations
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio #</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Placed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {effectiveReservations.slice(0, 6).map((res) => {
                  const guest = guestMap.get(res.guestId);
                  return (
                    <TableRow key={res.id}>
                      <TableCell className="font-mono-tabular font-semibold">
                        <Link
                          href={`/reservations/${res.id}`}
                          className="hover:text-[var(--accent-primary)]"
                        >
                          {res.reservationNumber}
                        </Link>
                      </TableCell>
                      <TableCell>{guest?.name ?? ""}</TableCell>
                      <TableCell className="font-mono-tabular text-xs">
                        {formatLocalDateMMDDYYYY(res.placedAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            res.status === "Confirmed"
                              ? "success"
                              : res.status === "Cancelled"
                                ? "danger"
                                : res.status === "Checked In"
                                  ? "info"
                                  : "warning"
                          }
                        >
                          {res.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        PHP {formatMoney(res.grandTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
