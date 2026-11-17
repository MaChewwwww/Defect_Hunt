"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { GuestFolioPrintSheet } from "@/components/hospitality/guest-folio-print-sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useSandbox } from "@/lib/store/sandbox-store";
import { resolveEffectiveReservation } from "@/lib/domain/calculations";

export default function ReservationFolioPage() {
  const params = useParams<{ id: string }>();
  const { db } = useSandbox();

  const rawReservation = db?.reservations.find((r) => r.id === params.id);
  const reservation = useMemo(() => {
    if (!db || !rawReservation) return null;
    return resolveEffectiveReservation(rawReservation, db.roomsPackages);
  }, [db, rawReservation]);

  if (!reservation || !db) {
    return (
      <WorkspaceShell>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </WorkspaceShell>
    );
  }

  const guest = db.guests.find((g) => g.id === reservation.guestId);

  return (
    <WorkspaceShell>
      <GuestFolioPrintSheet reservation={reservation} guest={guest} />
    </WorkspaceShell>
  );
}
