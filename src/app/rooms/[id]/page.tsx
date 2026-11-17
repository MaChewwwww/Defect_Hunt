"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { AllotmentHealthBar } from "@/components/hospitality/allotment-health-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSandbox } from "@/lib/store/sandbox-store";
import { formatLocalDateTimeMMDDYYYY } from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/utils";

export default function RoomDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { db, deleteRoomPackage } = useSandbox();

  const room = db?.roomsPackages.find((r) => r.id === params.id);
  const adjustments =
    db?.allotmentAdjustments.filter((a) => a.roomPackageId === params.id) ?? [];

  // @defect VH-56 (Medium | Routing | Usability)
  // Expected: Unknown dynamic IDs like /rooms/does-not-exist render a not-found state.
  // Actual: Shows an infinite loading skeleton forever when room is not found.
  if (!room) {
    return (
      <WorkspaceShell>
        <div className="space-y-4" data-testid="infinite-skeleton">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </WorkspaceShell>
    );
  }

  const handleDirectDelete = () => {
    // @defect VH-11 (Medium | Access control / Room detail | Security)
    // Expected: Staff cannot see or execute Delete on /rooms/[id].
    // Actual: Delete button is rendered and functional for Staff too.
    // @defect VH-27 (Medium | Rooms & Packages / detail | Usability)
    // Expected: Confirm deletion with a dialog just like on the /rooms list.
    // Actual: Deletes immediately without confirmation!
    deleteRoomPackage(room.id);
    router.push("/rooms");
  };

  return (
    <WorkspaceShell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Rooms &amp; Packages
            </Link>
            <h1 className="font-display text-3xl">{room.name}</h1>
            <div className="font-mono-tabular text-xs text-[var(--ink-muted)]">
              {room.code} &middot; {room.category}
            </div>
          </div>

          <Button
            variant="destructive"
            data-testid="room-detail-delete"
            onClick={handleDirectDelete}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Inventory &amp; Rate Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-[var(--ink-muted)]">Nightly / Unit Rate</div>
              <div className="font-mono-tabular text-xl font-semibold mt-1">
                PHP {formatMoney(room.rate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--ink-muted)]">Available Allotment</div>
              <div className="mt-1">
                <AllotmentHealthBar availableUnits={room.availableUnits} />
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--ink-muted)]">Last Updated</div>
              <div className="font-mono-tabular text-sm mt-1">
                {formatLocalDateTimeMMDDYYYY(room.updatedAt)}
              </div>
            </div>
            <div className="sm:col-span-3">
              <div className="text-xs text-[var(--ink-muted)]">Description</div>
              <p className="text-sm text-[var(--ink-secondary)] mt-1">
                {room.description}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allotment Adjustment Log</CardTitle>
          </CardHeader>
          <CardContent>
            {adjustments.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">
                No manual allotment adjustments recorded.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {adjustments.map((adj) => (
                  <li
                    key={adj.id}
                    className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2"
                  >
                    <div>
                      <span className="font-medium capitalize">{adj.type}</span>{" "}
                      <span className="font-mono-tabular">{adj.quantity}</span>{" "}
                      &mdash; {adj.reason}
                    </div>
                    <div className="text-xs text-[var(--ink-muted)] font-mono-tabular">
                      {adj.performedBy} &middot;{" "}
                      {formatLocalDateTimeMMDDYYYY(adj.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </WorkspaceShell>
  );
}
