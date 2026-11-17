"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { FolioMathBreakdown } from "@/components/hospitality/folio-math-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  formatDetailPlacedUtcDDMMYYYY,
  resolveEffectiveReservation,
} from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/utils";
import type { ReservationStatus } from "@/types/domain";

const ALL_STATUSES: ReservationStatus[] = [
  "Pending",
  "Confirmed",
  "Checked In",
  "Checked Out",
  "Cancelled",
];

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const { db, updateReservationStatus } = useSandbox();

  const rawReservation = db?.reservations.find((r) => r.id === params.id);
  const reservation = useMemo(() => {
    if (!db || !rawReservation) return null;
    return resolveEffectiveReservation(rawReservation, db.roomsPackages);
  }, [db, rawReservation]);

  // @defect VH-56 (Medium | Routing | Usability)
  // Expected: Render a not-found state for /reservations/does-not-exist.
  // Actual: Shows an infinite loading skeleton forever when reservation is missing.
  if (!reservation || !db) {
    return (
      <WorkspaceShell>
        <div className="space-y-4" data-testid="infinite-skeleton">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-44 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </WorkspaceShell>
    );
  }

  const guest = db.guests.find((g) => g.id === reservation.guestId);

  return (
    <WorkspaceShell>
      <div className="space-y-6 max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/reservations"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Reservations
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-3xl">
                {reservation.reservationNumber}
              </h1>
              <Badge>{reservation.status}</Badge>
            </div>
            {/* @defect VH-42 & VH-44: Displays DD/MM/YYYY and UTC time instead of local MM/DD/YYYY */}
            <div
              className="font-mono-tabular text-xs text-[var(--ink-muted)]"
              data-testid="detail-placed-timestamp"
            >
              Placed {formatDetailPlacedUtcDDMMYYYY(reservation.placedAt)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* @defect VH-37 (Medium | Reservations / status | Functional)
                Expected: Only next forward step (or Cancelled from Pending/Confirmed) allowed; Checked Out & Cancelled are final.
                Actual: Offers all 5 statuses regardless of current state, allowing backward transitions and reopening Cancelled. */}
            <Select
              aria-label="Reservation status"
              data-testid="detail-status-select"
              value={reservation.status}
              onChange={(e) =>
                updateReservationStatus(
                  reservation.id,
                  e.target.value as ReservationStatus
                )
              }
              className="w-44"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>

            <Button asChild>
              <Link href={`/reservations/${reservation.id}/folio`}>
                <FileText className="h-4 w-4" />
                View folio
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Guest Profile</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {guest ? (
                <>
                  <div className="font-semibold">
                    <Link
                      href={`/guests/${guest.id}`}
                      className="hover:text-[var(--accent-primary)]"
                    >
                      {guest.name}
                    </Link>
                  </div>
                  <div className="font-mono-tabular text-xs text-[var(--ink-secondary)]">
                    {guest.email}
                  </div>
                  <div className="font-mono-tabular text-xs text-[var(--ink-secondary)]">
                    {guest.phone}
                  </div>
                  <div className="text-xs text-[var(--ink-muted)]">
                    {guest.address}
                  </div>
                </>
              ) : (
                <div className="text-[var(--ink-muted)]">
                  Guest record no longer exists
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Special Requests / Folio Notes</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-[var(--ink-secondary)]">
              {/* Contrast for VH-15: Safely HTML-escaped as plain text on detail view */}
              <div data-testid="detail-notes">
                {reservation.notes || "No notes recorded."}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Booked Rooms &amp; Packages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Room / Package</TableHead>
                  <TableHead className="text-right">Unit Rate</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservation.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono-tabular text-xs">
                      {item.roomCodeSnapshot}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.roomNameSnapshot}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      PHP {formatMoney(item.unitRateSnapshot)}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular font-medium">
                      PHP {formatMoney(item.unitRateSnapshot * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Reservation Total</CardTitle>
            </CardHeader>
            <CardContent>
              {/* @defect VH-39 (Medium | Reservations / detail | Functional)
                  Expected: Same total (1,370.00) as Reservations list.
                  Actual: Adds 250.00 Service & Environmental Fee a second time (1,620.00). */}
              <FolioMathBreakdown
                subtotal={reservation.subtotal}
                discountPercent={reservation.discountPercent}
                discountAmount={reservation.discountAmount}
                taxAmount={reservation.taxAmount}
                grandTotal={reservation.grandTotal}
                doubleServiceFee
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceShell>
  );
}
