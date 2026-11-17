"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
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
  formatLocalDateTimeMMDDYYYY,
  resolveEffectiveReservation,
} from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/utils";

export default function ReservationsPage() {
  const { db } = useSandbox();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const guestMap = useMemo(
    () => new Map((db?.guests ?? []).map((g) => [g.id, g])),
    [db]
  );

  const effectiveReservations = useMemo(() => {
    if (!db) return [];
    return db.reservations.map((r) =>
      resolveEffectiveReservation(r, db.roomsPackages)
    );
  }, [db]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return effectiveReservations.filter((r) => {
      const guestName = guestMap.get(r.guestId)?.name ?? "";
      if (
        q &&
        !r.reservationNumber.toLowerCase().includes(q) &&
        !guestName.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (statusFilter !== "All") {
        // @defect VH-40 (Easy | Reservations / list | Functional)
        // Expected: Status filter "Checked In" returns only "Checked In" reservations.
        // Actual: Selecting "Checked In" also includes "Checked Out" reservations.
        if (statusFilter === "Checked In") {
          return r.status === "Checked In" || r.status === "Checked Out";
        }
        return r.status === statusFilter;
      }
      return true;
    });
  }, [effectiveReservations, guestMap, search, statusFilter]);

  return (
    <WorkspaceShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl">Reservations &amp; Folios</h1>
            <p className="text-sm text-[var(--ink-muted)]">
              Create bookings, track check-in status, and issue guest billing
              folios
            </p>
          </div>
          <Button asChild>
            <Link href="/reservations/new">
              <Plus className="h-4 w-4" />
              Create Reservation
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search reservation # or guest..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select
              aria-label="Filter by status"
              data-testid="reservations-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="sm:w-52"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Checked In">Checked In</option>
              <option value="Checked Out">Checked Out</option>
              <option value="Cancelled">Cancelled</option>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table data-testid="reservations-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Folio #</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Placed (Local)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((res) => {
                  const guest = guestMap.get(res.guestId);
                  return (
                    <TableRow
                      key={res.id}
                      data-testid={`reservation-row-${res.reservationNumber}`}
                    >
                      <TableCell className="font-mono-tabular font-semibold">
                        <Link
                          href={`/reservations/${res.id}`}
                          className="hover:text-[var(--accent-primary)]"
                        >
                          {res.reservationNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {/* @defect VH-46 (Medium | Guests / Reservations | Data)
                            When a guest like Daniel Cruz is deleted, renders an empty cell linking to /guests/[id] (blank page). */}
                        <Link
                          href={`/guests/${res.guestId}`}
                          data-testid={`reservation-guest-link-${res.reservationNumber}`}
                          className="block min-h-[20px] hover:text-[var(--accent-primary)]"
                        >
                          {guest ? guest.name : ""}
                        </Link>
                      </TableCell>
                      <TableCell
                        className="font-mono-tabular text-xs"
                        data-testid={`reservation-date-${res.reservationNumber}`}
                      >
                        {formatLocalDateTimeMMDDYYYY(res.placedAt)}
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
                      <TableCell
                        className="text-right font-mono-tabular font-medium"
                        data-testid={`reservation-total-${res.reservationNumber}`}
                      >
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
