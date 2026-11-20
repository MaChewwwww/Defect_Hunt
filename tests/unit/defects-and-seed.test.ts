import { describe, expect, it } from "vitest";
import {
  calculateCanonicalFolioTotals,
  calculateDefectiveFolioTotals,
  formatDetailPlacedUtcDDMMYYYY,
  LOW_ALLOTMENT_THRESHOLD,
  resolveEffectiveReservation,
} from "@/lib/domain/calculations";
import {
  COMPETITION_GROUPS,
  createInitialSandboxDb,
  resolveGroupByEmail,
} from "@/lib/domain/seed";
import { buildReportsCsvContent } from "@/app/reports/page";

describe("Veranda PMS Seed & Planted Domain Defects", () => {
  const anchorNow = new Date("2026-11-16T07:00:00.000Z"); // 3:00 PM Asia/Manila
  const db = createInitialSandboxDb("test-sandbox-01", anchorNow);

  it("seeds exact counts, plaintext passwords (VH-14), and category/allotment boundaries (VH-17, VH-25)", () => {
    expect(db.users).toHaveLength(3);
    expect(db.users[0].password).toBe("Admin@123"); // VH-14 plaintext check

    expect(db.roomsPackages).toHaveLength(20);
    expect(
      db.roomsPackages.filter((r) => r.category === "Villas & Suites")
    ).toHaveLength(12); // VH-25 pagination

    expect(
      db.roomsPackages.filter((r) => r.availableUnits <= LOW_ALLOTMENT_THRESHOLD)
    ).toHaveLength(8); // VH-17 KPI
    expect(
      db.roomsPackages.filter((r) => r.availableUnits < LOW_ALLOTMENT_THRESHOLD)
    ).toHaveLength(7); // VH-17 Watchlist

    expect(db.guests).toHaveLength(10);
    expect(db.reservations).toHaveLength(20);

    // Guest booking counts for VH-47
    expect(db.reservations.filter((r) => r.guestId === "gst-01")).toHaveLength(6); // Maria Santos
    expect(db.reservations.filter((r) => r.guestId === "gst-02")).toHaveLength(3); // Maria Reyes
  });

  it("VH-32: calculates 12% VAT on gross subtotal before discount instead of net subtotal", () => {
    const canonical = calculateCanonicalFolioTotals(
      [{ quantity: 2, unitRate: 1200 }],
      10
    );
    expect(canonical.taxAmount).toBe(259.2);
    expect(canonical.grandTotal).toBe(2669.2);

    const defective = calculateDefectiveFolioTotals(
      [{ quantity: 2, unitRate: 1200 }],
      10
    );
    expect(defective.taxAmount).toBe(288.0);
    expect(defective.grandTotal).toBe(2698.0);
  });

  it("VH-29: editing room rate mutates historical reservation totals dynamically", () => {
    const rsv2045 = db.reservations.find((r) => r.reservationNumber === "RSV-2045")!;
    expect(rsv2045.grandTotal).toBe(1370.0);

    const modifiedRooms = db.roomsPackages.map((room) =>
      room.code === "SB-1002" ? { ...room, rate: 800 } : room
    );
    const effective = resolveEffectiveReservation(rsv2045, modifiedRooms);
    expect(effective.items[0].unitRateSnapshot).toBe(800);
    expect(effective.grandTotal).toBe(2042.0);
  });

  it("VH-18 & VH-44: anchors RSV-2033 at 12:30 AM Manila on 1st of last month -> UTC previous month", () => {
    const rsv2033 = db.reservations.find((r) => r.reservationNumber === "RSV-2033")!;
    const utcDate = new Date(rsv2033.placedAt);
    // In UTC, 2026-10-01 00:30+08:00 is 2026-09-30 16:30Z
    expect(utcDate.getUTCMonth()).toBe(8); // September (0-indexed)
    expect(formatDetailPlacedUtcDDMMYYYY(rsv2033.placedAt)).toBe(
      "30/09/2026, 04:30 PM"
    );
  });

  it("VH-49 & VH-50: CSV export leaves comma unquoted and drops final row", () => {
    const guestMap = new Map(db.guests.map((g) => [g.id, g.name]));
    const last7d = db.reservations.slice(0, 6); // RSV-2045..RSV-2040
    const csv = buildReportsCsvContent(last7d, guestMap);
    const lines = csv.split("\n");
    // 1 header + 5 rows (last row dropped per VH-50)
    expect(lines).toHaveLength(6);
    // Cabana Suite, Poolside is unquoted per VH-49
    expect(csv).toContain("Cabana Suite, Poolside");
    expect(csv).not.toContain('"Cabana Suite, Poolside');
  });

  it("assigns 5 seeded competition group accounts to distinct isolated sandbox IDs", () => {
    expect(COMPETITION_GROUPS).toHaveLength(5);
    const seenSandboxes = new Set<string>();

    for (let i = 0; i < COMPETITION_GROUPS.length; i += 1) {
      const group = COMPETITION_GROUPS[i];
      const groupNum = i + 1;
      const expectedAdminEmail = `admin.group${groupNum}@verandapms.test`;
      const expectedStaffEmail = `staff.group${groupNum}@verandapms.test`;
      const expectedFormerEmail = `former.group${groupNum}@verandapms.test`;

      expect(group.accounts.admin.email).toBe(expectedAdminEmail);
      expect(group.accounts.staff.email).toBe(expectedStaffEmail);
      expect(group.accounts.deactivated.email).toBe(expectedFormerEmail);

      expect(resolveGroupByEmail(expectedAdminEmail)?.sandboxId).toBe(
        group.sandboxId
      );
      expect(resolveGroupByEmail(expectedStaffEmail)?.sandboxId).toBe(
        group.sandboxId
      );
      expect(resolveGroupByEmail(expectedFormerEmail)?.sandboxId).toBe(
        group.sandboxId
      );
      // Un-trimmed emails must not resolve a group (preserves VH-01)
      expect(resolveGroupByEmail(` ${expectedAdminEmail} `)).toBeUndefined();

      seenSandboxes.add(group.sandboxId);
      const groupDb = createInitialSandboxDb(group.sandboxId, anchorNow);
      expect(groupDb.ownerGroupId).toBe(group.id);
      expect(groupDb.ownerGroupName).toBe(group.name);
      expect(groupDb.users).toHaveLength(3);
      expect(groupDb.users.map((u) => u.email)).toEqual([
        expectedAdminEmail,
        expectedStaffEmail,
        expectedFormerEmail,
      ]);
      expect(groupDb.roomsPackages).toHaveLength(20);
      expect(groupDb.reservations).toHaveLength(20);
    }

    expect(seenSandboxes.size).toBe(5);
  });
});
