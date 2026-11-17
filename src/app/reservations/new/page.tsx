"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { FolioMathBreakdown } from "@/components/hospitality/folio-math-breakdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSandbox } from "@/lib/store/sandbox-store";
import {
  calculateDefectiveFolioTotals,
  toLocalDateKey,
} from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/utils";

interface DraftLine {
  key: string;
  roomPackageId: string;
  quantity: string;
}

export default function NewReservationPage() {
  const router = useRouter();
  const { db, createReservation } = useSandbox();

  const guests = useMemo(() => db?.guests ?? [], [db]);
  const rooms = useMemo(() => db?.roomsPackages ?? [], [db]);

  const [guestId, setGuestId] = useState(guests[0]?.id || "gst-01");
  const [placedDate, setPlacedDate] = useState(
    toLocalDateKey(new Date().toISOString())
  );
  const [selectedRoomId, setSelectedRoomId] = useState(
    rooms[0]?.id || "rm-1001"
  );
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const roomMap = useMemo(
    () => new Map(rooms.map((r) => [r.id, r])),
    [rooms]
  );

  const previewTotals = useMemo(() => {
    const items = lines
      .map((l) => {
        const room = roomMap.get(l.roomPackageId);
        const qty = Number(l.quantity);
        if (!room || !Number.isFinite(qty)) return null;
        return { quantity: qty, unitRate: room.rate };
      })
      .filter((x): x is { quantity: number; unitRate: number } => x !== null);

    const disc = Number(discountPercent);
    return calculateDefectiveFolioTotals(
      items,
      Number.isFinite(disc) ? disc : 0
    );
  }, [lines, roomMap, discountPercent]);

  const handleAddLine = () => {
    const room = roomMap.get(selectedRoomId);
    if (!room) return;
    // @defect VH-31 (Medium | Reservations / Create | Functional)
    // Allows adding out-of-allotment rooms (availableUnits === 0) into the booking lines.
    setLines((prev) => [
      ...prev,
      {
        key: `${room.id}-${Date.now()}-${Math.random()}`,
        roomPackageId: room.id,
        quantity: "1",
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedItems = lines.map((l) => ({
      roomPackageId: l.roomPackageId,
      quantity: Number(l.quantity),
    }));

    // Build ISO timestamp using selected date in local time
    const now = new Date();
    const parts = placedDate.split("-").map(Number);
    let placedIso = now.toISOString();
    if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
      const localDateObj = new Date(
        parts[0],
        parts[1] - 1,
        parts[2],
        now.getHours(),
        now.getMinutes(),
        now.getSeconds()
      );
      placedIso = localDateObj.toISOString();
    }

    const res = createReservation({
      guestId,
      placedDateIso: placedIso,
      discountPercent: Number(discountPercent),
      notes,
      items: parsedItems,
    });

    if (!res.ok || !res.data) {
      setError(res.error || "Unable to create reservation.");
      return;
    }

    // @defect VH-41 (Medium | Reservations / Create | Functional)
    // Expected: Submit button is disabled while submitting so double-click creates one reservation.
    // Actual: Button stays enabled and navigation is deferred briefly, so double-clicking creates two consecutive reservations!
    setTimeout(() => {
      router.push("/reservations");
    }, 250);
  };

  return (
    <WorkspaceShell>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1">
          <Link
            href="/reservations"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Reservations
          </Link>
          <h1 className="font-display text-3xl">Create Reservation</h1>
        </div>

        {error && (
          <div
            role="alert"
            data-testid="create-reservation-error"
            className="rounded-lg border border-red-500/30 bg-[var(--status-danger-bg)] px-4 py-3 text-xs font-medium text-[var(--status-danger-fg)]"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form Column */}
          <div className="lg:col-span-8 space-y-6 min-w-0">
            <Card>
              <CardHeader>
                <CardTitle>Guest &amp; Reservation Date</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rsv-guest">Guest</Label>
                  <Select
                    id="rsv-guest"
                    value={guestId}
                    onChange={(e) => setGuestId(e.target.value)}
                  >
                    {guests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} ({g.loyaltyTier})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rsv-date">Reservation Date</Label>
                  <Input
                    id="rsv-date"
                    type="date"
                    value={placedDate}
                    onChange={(e) => setPlacedDate(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Rooms &amp; Concierge Packages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    aria-label="Select room or package"
                    data-testid="add-room-select"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="flex-1"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.code} &mdash; {r.name} (PHP {formatMoney(r.rate)}
                        {r.availableUnits <= 0
                          ? " · Out of allotment"
                          : ` · ${r.availableUnits} avail`}
                        )
                      </option>
                    ))}
                  </Select>
                  <Button
                    type="button"
                    variant="secondary"
                    data-testid="add-room-line-btn"
                    onClick={handleAddLine}
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>

                {/* Line Items Container */}
                <div
                  data-testid="reservation-lines-container"
                  className="overflow-x-auto space-y-2.5 pb-1"
                >
                  {lines.length === 0 ? (
                    <p className="text-xs text-[var(--ink-muted)] py-4 text-center border border-dashed border-[var(--border-subtle)] rounded-lg">
                      No rooms or packages added yet. Select an item above and
                      click Add.
                    </p>
                  ) : (
                    lines.map((line, idx) => {
                      const room = roomMap.get(line.roomPackageId);
                      if (!room) return null;
                      const qtyNum = Number(line.quantity) || 0;
                      const lineTotal = room.rate * qtyNum;
                      return (
                        // @defect VH-24 (Medium | Reservations / Create | UI)
                        // Expected: Long room name truncates or wraps cleanly so Unit rate, Quantity, and Line total stay visible.
                        // Actual: whitespace-nowrap without truncation stretches the row wider than the card when SB-1009 is picked.
                        <div
                          key={line.key}
                          data-testid={`draft-line-${idx}`}
                          className="flex items-center justify-between gap-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3.5 py-2.5 whitespace-nowrap min-w-full w-max"
                        >
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span className="font-mono-tabular text-xs text-[var(--ink-muted)]">
                              {room.code}
                            </span>
                            <span className="text-sm font-medium whitespace-nowrap">
                              {room.name}
                            </span>
                            {room.availableUnits <= 0 && (
                              <Badge variant="danger">Out of allotment</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 shrink-0">
                            <div className="text-xs font-mono-tabular text-[var(--ink-secondary)]">
                              PHP {formatMoney(room.rate)}
                            </div>
                            <Input
                              type="number"
                              step="any"
                              aria-label={`Quantity line ${idx + 1}`}
                              data-testid={`line-qty-${idx}`}
                              value={line.quantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLines((prev) =>
                                  prev.map((item, i) =>
                                    i === idx
                                      ? { ...item, quantity: val }
                                      : item
                                  )
                                );
                              }}
                              className="w-20 h-8 font-mono-tabular text-right"
                            />
                            <div className="w-28 text-right text-sm font-mono-tabular font-semibold">
                              PHP {formatMoney(lineTotal)}
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() =>
                                setLines((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4 text-[var(--status-danger-fg)]" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Discount &amp; Folio Notes</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rsv-discount">Discount (%)</Label>
                  <Input
                    id="rsv-discount"
                    type="number"
                    step="any"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="rsv-notes">
                    Special Requests / Folio Notes
                  </Label>
                  <Input
                    id="rsv-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional arrival notes or special requests"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Summary Card */}
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Folio Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FolioMathBreakdown
                subtotal={previewTotals.subtotal}
                discountPercent={Number(discountPercent) || 0}
                discountAmount={previewTotals.discountAmount}
                taxAmount={previewTotals.taxAmount}
                grandTotal={previewTotals.grandTotal}
              />
              <Button
                type="submit"
                data-testid="place-reservation-btn"
                className="w-full h-10"
              >
                Place Reservation
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </WorkspaceShell>
  );
}
