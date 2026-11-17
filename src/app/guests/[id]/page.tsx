"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Badge } from "@/components/ui/badge";
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
} from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/utils";

export default function GuestDetailPage() {
  const params = useParams<{ id: string }>();
  const { db } = useSandbox();

  const guest = db?.guests.find((g) => g.id === params.id);

  // @defect VH-47 (Hard | Guests / detail | Functional)
  // Expected: Match reservations strictly by r.guestId === guest.id.
  // Actual: Matches reservations by guest's first name, causing "Maria Santos" (6) and "Maria Reyes" (3) to both display 9 reservations!
  const matchedReservations = useMemo(() => {
    if (!db || !guest) return [];
    const targetFirstName = guest.name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
    const guestMap = new Map(db.guests.map((g) => [g.id, g]));

    return db.reservations
      .filter((r) => {
        const resGuest = guestMap.get(r.guestId);
        if (!resGuest) return false;
        const resFirst =
          resGuest.name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
        return resFirst === targetFirstName;
      })
      .map((r) => resolveEffectiveReservation(r, db.roomsPackages));
  }, [db, guest]);

  // @defect VH-46 (Medium | Guests / Reservations | Data)
  // Clicking an empty Guest cell whose guest was deleted opens a blank page.
  if (!guest) {
    return (
      <WorkspaceShell>
        <div data-testid="blank-guest-detail" className="min-h-[240px]" />
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <div className="space-y-6 max-w-4xl">
        <div className="space-y-1">
          <Link
            href="/guests"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Guests
          </Link>
          <h1 className="font-display text-3xl">{guest.name}</h1>
          <div className="text-xs text-[var(--ink-muted)]">
            {guest.loyaltyTier} Member
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-[var(--ink-muted)]">Email</div>
              <div className="font-mono-tabular mt-1">{guest.email}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--ink-muted)]">Phone</div>
              <div className="font-mono-tabular mt-1">{guest.phone}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--ink-muted)]">Address</div>
              <div className="mt-1">{guest.address}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle data-testid="guest-history-heading">
              Reservation History ({matchedReservations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table data-testid="guest-reservations-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Folio #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchedReservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono-tabular font-semibold">
                      <Link
                        href={`/reservations/${r.id}`}
                        className="hover:text-[var(--accent-primary)]"
                      >
                        {r.reservationNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono-tabular text-xs">
                      {formatLocalDateMMDDYYYY(r.placedAt)}
                    </TableCell>
                    <TableCell>
                      <Badge>{r.status}</Badge>
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
