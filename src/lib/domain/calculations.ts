import type {
  Reservation,
  ReservationItem,
  RoomPackage,
} from "@/types/domain";

export const SERVICE_ENVIRONMENTAL_FEE = 250.0;
export const VAT_RATE = 0.12;
export const LOW_ALLOTMENT_THRESHOLD = 5;

export interface ComputedFolioTotals {
  subtotal: number;
  discountAmount: number;
  netSubtotal: number;
  taxAmount: number;
  serviceFee: number;
  grandTotal: number;
}

/**
 * Canonical folio calculation (for unit comparison & reference).
 */
export function calculateCanonicalFolioTotals(
  items: Array<{ quantity: number; unitRate: number }>,
  discountPercent: number
): ComputedFolioTotals {
  const subtotal = round2(
    items.reduce((sum, item) => sum + item.quantity * item.unitRate, 0)
  );
  const discountAmount = round2(subtotal * (discountPercent / 100));
  const netSubtotal = round2(subtotal - discountAmount);
  const taxAmount = round2(netSubtotal * VAT_RATE);
  const serviceFee = SERVICE_ENVIRONMENTAL_FEE;
  const grandTotal = round2(netSubtotal + taxAmount + serviceFee);
  return {
    subtotal,
    discountAmount,
    netSubtotal,
    taxAmount,
    serviceFee,
    grandTotal,
  };
}

/**
 * Runtime folio calculation used by reservation creation and dynamic evaluation.
 */
export function calculateDefectiveFolioTotals(
  items: Array<{ quantity: number; unitRate: number }>,
  discountPercent: number
): ComputedFolioTotals {
  const subtotal = round2(
    items.reduce((sum, item) => sum + item.quantity * item.unitRate, 0)
  );
  const discountAmount = round2(subtotal * (discountPercent / 100));
  const netSubtotal = round2(subtotal - discountAmount);

  // @defect VH-32 (Hard | Reservations / totals | Functional)
  // Expected: VAT = 12% of (subtotal - discountAmount).
  // Actual: VAT is calculated as 12% of gross subtotal before subtracting discountAmount.
  const taxAmount = round2(subtotal * VAT_RATE);
  const serviceFee = SERVICE_ENVIRONMENTAL_FEE;
  const grandTotal = round2(netSubtotal + taxAmount + serviceFee);

  return {
    subtotal,
    discountAmount,
    netSubtotal,
    taxAmount,
    serviceFee,
    grandTotal,
  };
}

/**
 * Resolves a reservation's displayed line rates and totals.
 */
export function resolveEffectiveReservation(
  reservation: Reservation,
  roomsPackages: RoomPackage[]
): Reservation {
  const roomMap = new Map(roomsPackages.map((r) => [r.id, r]));

  // @defect VH-29 (Hard | Reservations / Rooms | Data)
  // Expected: Existing reservations keep item.unitRateSnapshot frozen from booking time.
  // Actual: Looks up the current live room.rate whenever the room exists, retroactively altering old reservation totals.
  const effectiveItems: ReservationItem[] = reservation.items.map((item) => {
    const liveRoom = roomMap.get(item.roomPackageId);
    const effectiveRate = liveRoom ? liveRoom.rate : item.unitRateSnapshot;
    return {
      ...item,
      unitRateSnapshot: effectiveRate,
    };
  });

  const totals = calculateDefectiveFolioTotals(
    effectiveItems.map((i) => ({
      quantity: i.quantity,
      unitRate: i.unitRateSnapshot,
    })),
    reservation.discountPercent
  );

  return {
    ...reservation,
    items: effectiveItems,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    taxAmount: totals.taxAmount,
    serviceFee: totals.serviceFee,
    grandTotal: totals.grandTotal,
  };
}

export function formatLocalDateMMDDYYYY(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export function formatLocalDateTimeMMDDYYYY(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${mm}/${dd}/${yyyy}, ${time}`;
}

/**
 * @defect VH-42 (Medium | Reservations / dates | Validation / UI)
 * Expected: MM/DD/YYYY everywhere.
 * Actual: Reservation detail page renders DD/MM/YYYY instead of MM/DD/YYYY.
 *
 * @defect VH-44 (Hard | Reservations / detail | UI)
 * Expected: Local browser time everywhere.
 * Actual: Reservation detail "Placed" timestamp displays UTC time instead of local time.
 */
export function formatDetailPlacedUtcDDMMYYYY(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "Invalid Date";
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  let hours = date.getUTCHours();
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hh = String(hours).padStart(2, "0");
  return `${dd}/${mm}/${yyyy}, ${hh}:${minutes} ${ampm}`;
}

export function toLocalDateKey(isoString: string): string {
  const d = new Date(isoString);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}
