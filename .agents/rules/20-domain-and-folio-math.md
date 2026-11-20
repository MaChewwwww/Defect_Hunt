# 20 — Domain and Folio Math

Follow [PROJECT_OVERVIEW.md](../../docs/PROJECT_OVERVIEW.md), [DATABASE.md](../../docs/DATABASE.md), and [WORKFLOWS.md](../../docs/WORKFLOWS.md).

## Canonical Hospitality Formulas (Expected Baseline)

1. **Folio Calculation Formula**:
   - `Subtotal = sum(unit_rate * quantity)` across all line items in the reservation.
   - `Discount Amount = Subtotal * (discount_percent / 100)`
   - `Net Subtotal = Subtotal - Discount Amount`
   - `Tax (12% VAT) = 0.12 * (Subtotal - Discount Amount)`
   - `Service & Environmental Fee = 250.00` (flat PHP fee per reservation)
   - `Grand Total = (Subtotal - Discount Amount) + 12% VAT + 250.00`
2. **Allotment (`available_units`) Lifecycle**:
   - Deduct `available_units` **once** when a reservation is created (`Pending`).
   - Restore `available_units` when a reservation is `Cancelled`.
   - **Low Allotment** threshold is `available_units <= 5`.
3. **Revenue & Average Booking Value (ABV)**:
   - Revenue **excludes** `Cancelled` reservations and **includes** the `250.00` Service & Environmental Fee.
   - `ABV = Non-Cancelled Revenue / Non-Cancelled Reservation Count`.
4. **Dates & Timezones**:
   - Canonical display format is `MM/DD/YYYY` in browser local time (`Asia/Manila`, `UTC+8`).

## Named Seed Entities (Do Not Rename or Alter Values)

Several planted defects (`VH-16` through `VH-51`) depend on exact seed names, codes, rates, and quantities defined in [DATABASE.md](../../docs/DATABASE.md):
- **Per-Group Demo Accounts (`N = 1..5`, isolated sandbox per group)**:
  - Admin: `admin.groupN@verandapms.test` / `Admin@123` (`Elena Marasigan`)
  - Staff: `staff.groupN@verandapms.test` / `Staff@123` (`Marco Villanueva`)
  - Staff (deactivated): `former.groupN@verandapms.test` / `Former@123` (`Tricia Soriano`, inactive)
- **Critical Rooms & Packages**:
  - `SB-1001`: `Premier Oceanfront Villa` (Rate `6,400.00`, Allotment `12`, Category `Villas & Suites`)
  - `SB-1002`: `Teakwood Lanai Daybed` (Rate `500.00`, Allotment `26`) — booked x2 in `RSV-2045` (`Grand Total = 1,370.00`)
  - `SB-1003`: `Sunset Catamaran Charter` (Rate `1,200.00`, Allotment `18`) — x2 (`2,400.00`) with 10% discount used in `VH-32`
  - `SB-1004`: `Cabana Suite, Poolside` (Rate `950.00`, Allotment `34`) — contains a comma for `VH-49` CSV defect and booked in `RSV-2043` for `VH-38`
  - `SB-1005`: `Botanical Welcome Amenity Set` (Rate `250.00`, Allotment `96`) — booked x3 in `RSV-2043` for `VH-38`
  - `SB-1006`: `Coral Reef Private Cabana` (Rate `990.00`, Allotment `5`) — exact `<= 5` boundary item missing from `< 5` list in `VH-17`
  - `SB-1007`: `Cliffside Infinity Pavilion` (Rate `1,800.00`, Allotment `0`, Out of allotment) — used in `VH-31`
  - `SB-1008`: `Terracotta Courtyard Suite` (Rate `975.00`, Allotment `7`) — used in `VH-30` (Remove 50 -> `-43`)
  - `SB-1009`: `Solstice Bay Presidential Sanctuary Three-Bedroom Cliffside Oceanfront Pool Villa with Private Butler Service` — used in `VH-24` overflow
  - `SB-1010`: `Eucalyptus Steam & Spa Ritual` (Rate `900.00`, Allotment `15`) — used in `VH-28` Edit Cancel bug
  - `SB-1011`: `Island Kayaking & Snorkeling Expedition` (Rate `750.00`, Allotment `23`) — used in `VH-35` (two lines of 20 -> `-17`)
- **Critical Guests**:
  - `Maria Santos` (6 reservations), `Maria Reyes` (3 reservations, including `RSV-2045`), `Daniel Cruz` (2 reservations, used in `VH-46`).
