"use client";

import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolioMathBreakdown } from "./folio-math-breakdown";
import { formatLocalDateMMDDYYYY } from "@/lib/domain/calculations";
import { formatMoney } from "@/lib/utils";
import type { Guest, Reservation } from "@/types/domain";

export function GuestFolioPrintSheet({
  reservation,
  guest,
}: {
  reservation: Reservation;
  guest: Guest | undefined;
}) {
  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-normal">
            Official Guest Folio — {reservation.reservationNumber}
          </h1>
          <p className="text-xs text-[var(--ink-muted)]">
            Solstice Bay Resort &amp; Villas Guest Statement
          </p>
        </div>
        <Button onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print Folio
        </Button>
      </div>

      <div className="print-sheet rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-10 space-y-8 shadow-sm">
        {/* Masthead */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div>
            <div className="font-display text-3xl text-[var(--ink-primary)]">
              Solstice Bay Resort &amp; Villas
            </div>
            <div className="text-xs text-[var(--ink-muted)] mt-1">
              San Juan, La Union &amp; El Nido, Palawan &middot; Veranda PMS
            </div>
          </div>
          <div className="text-left sm:text-right font-mono-tabular text-xs space-y-1">
            <div className="text-sm font-semibold text-[var(--ink-primary)]">
              FOLIO {reservation.reservationNumber}
            </div>
            <div className="text-[var(--ink-secondary)]">
              Date: {formatLocalDateMMDDYYYY(reservation.placedAt)}
            </div>
            <div className="text-[var(--ink-secondary)]">
              Status: {reservation.status}
            </div>
          </div>
        </div>

        {/* Billing Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Billed to
            </div>
            {/* @defect VH-43 (Hard | Reservations / Folio | Functional)
                Expected: Show guest.name ("Maria Reyes") above email, phone, and address.
                Actual: Guest name is omitted; only email, phone, and address are rendered. */}
            {guest ? (
              <div
                className="space-y-0.5 text-[var(--ink-secondary)]"
                data-testid="folio-billed-to"
              >
                <div>{guest.email}</div>
                <div>{guest.phone}</div>
                <div>{guest.address}</div>
              </div>
            ) : (
              <div className="text-[var(--ink-muted)]">Guest record removed</div>
            )}
          </div>

          <div className="space-y-1 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
              Folio Notes
            </div>
            {/* @defect VH-15 (Hard | Reservations / Folio | Security)
                Expected: Notes are HTML-escaped on all pages including Folio print sheet.
                Actual: Escaped on /reservations/[id] detail, but rendered via dangerouslySetInnerHTML here (stored XSS). */}
            <div
              className="text-[var(--ink-secondary)]"
              dangerouslySetInnerHTML={{
                __html: reservation.notes || "None recorded.",
              }}
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto border border-[var(--border-subtle)] rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] text-xs uppercase text-[var(--ink-muted)]">
              <tr>
                <th className="px-4 py-2.5 text-left">Room / Package</th>
                <th className="px-4 py-2.5 text-right">Rate</th>
                <th className="px-4 py-2.5 text-right">Qty / Nights</th>
                <th className="px-4 py-2.5 text-right">Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {reservation.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--ink-primary)]">
                      {item.roomNameSnapshot}
                    </div>
                    <div className="font-mono-tabular text-xs text-[var(--ink-muted)]">
                      {item.roomCodeSnapshot}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono-tabular">
                    PHP {formatMoney(item.unitRateSnapshot)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-tabular">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-mono-tabular font-medium">
                    PHP {formatMoney(item.unitRateSnapshot * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Breakdown */}
        <div className="flex justify-end">
          <div className="w-full max-w-sm">
            {/* @defect VH-43: omitServiceFeeFromTotal shows 250.00 fee row but leaves it out of Grand Total */}
            <FolioMathBreakdown
              subtotal={reservation.subtotal}
              discountPercent={reservation.discountPercent}
              discountAmount={reservation.discountAmount}
              taxAmount={reservation.taxAmount}
              grandTotal={reservation.grandTotal}
              omitServiceFeeFromTotal
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border-subtle)] pt-5 text-center text-xs text-[var(--ink-muted)]">
          {/* @defect VH-57 (Medium | Text | UI)
              Expected: "Thank you for your purchase"
              Actual: Misspelled "Thank you for your purchse" */}
          Thank you for your purchse
        </div>
      </div>
    </div>
  );
}
