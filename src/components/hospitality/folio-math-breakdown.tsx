import React from "react";
import { formatMoney } from "@/lib/utils";
import { SERVICE_ENVIRONMENTAL_FEE } from "@/lib/domain/calculations";

export function FolioMathBreakdown({
  subtotal,
  discountPercent,
  discountAmount,
  taxAmount,
  grandTotal,
  doubleServiceFee = false,
  omitServiceFeeFromTotal = false,
}: {
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  doubleServiceFee?: boolean;
  omitServiceFeeFromTotal?: boolean;
}) {
  // @defect VH-39: doubleServiceFee adds 250.00 twice on Reservation Detail
  // @defect VH-43: omitServiceFeeFromTotal omits 250.00 from Grand Total on Guest Folio print sheet
  const displayedTotal = doubleServiceFee
    ? grandTotal + SERVICE_ENVIRONMENTAL_FEE
    : omitServiceFeeFromTotal
      ? subtotal - discountAmount + taxAmount
      : grandTotal;

  return (
    <div className="space-y-2.5 text-sm">
      <div className="flex items-center justify-between text-[var(--ink-secondary)]">
        <span>Room &amp; Package Subtotal</span>
        <span className="font-mono-tabular">PHP {formatMoney(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between text-[var(--ink-secondary)]">
        <span>Discount ({discountPercent}%)</span>
        <span className="font-mono-tabular">
          - PHP {formatMoney(discountAmount)}
        </span>
      </div>
      <div className="flex items-center justify-between text-[var(--ink-secondary)]">
        <span>VAT (12%)</span>
        <span className="font-mono-tabular">PHP {formatMoney(taxAmount)}</span>
      </div>
      <div className="flex items-center justify-between text-[var(--ink-secondary)]">
        <span>Service &amp; Environmental Fee</span>
        <span className="font-mono-tabular">
          PHP {formatMoney(SERVICE_ENVIRONMENTAL_FEE)}
        </span>
      </div>
      <div className="border-t border-[var(--border-subtle)] pt-2.5 flex items-center justify-between font-semibold text-base text-[var(--ink-primary)]">
        <span>Grand Total</span>
        <span
          className="font-mono-tabular text-[var(--accent-primary)]"
          data-testid="folio-grand-total"
        >
          PHP {formatMoney(displayedTotal)}
        </span>
      </div>
    </div>
  );
}
