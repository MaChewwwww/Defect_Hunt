import type {
  AllotmentAdjustment,
  Guest,
  Reservation,
  ReservationStatus,
  RoomPackage,
  SandboxDatabase,
  UserRecord,
  UserRole,
} from "@/types/domain";
import {
  calculateDefectiveFolioTotals,
  SERVICE_ENVIRONMENTAL_FEE,
} from "./calculations";

export interface CompetitionGroupAccount {
  userId: string;
  userName: string;
  email: string;
  password: string;
  role: UserRole;
  isActive: boolean;
  label: "Admin" | "Staff" | "Staff (deactivated)";
}

export interface CompetitionGroupConfig {
  id: string;
  number: number;
  sandboxId: string;
  name: string;
  accounts: {
    admin: CompetitionGroupAccount;
    staff: CompetitionGroupAccount;
    deactivated: CompetitionGroupAccount;
  };
}

function buildCompetitionGroup(
  number: number,
  resortWing: string
): CompetitionGroupConfig {
  const padded = String(number).padStart(12, "0");
  return {
    id: `group-${number}`,
    number,
    sandboxId: `00000000-0000-4000-8000-${padded}`,
    name: `Group ${number} — ${resortWing}`,
    accounts: {
      admin: {
        userId: "usr-admin-01",
        userName: "Elena Marasigan",
        email: `admin.group${number}@verandapms.test`,
        password: "Admin@123",
        role: "admin",
        isActive: true,
        label: "Admin",
      },
      staff: {
        userId: "usr-staff-01",
        userName: "Marco Villanueva",
        email: `staff.group${number}@verandapms.test`,
        password: "Staff@123",
        role: "staff",
        isActive: true,
        label: "Staff",
      },
      deactivated: {
        userId: "usr-former-01",
        userName: "Tricia Soriano",
        email: `former.group${number}@verandapms.test`,
        password: "Former@123",
        role: "staff",
        isActive: false,
        label: "Staff (deactivated)",
      },
    },
  };
}

export const COMPETITION_GROUPS: readonly CompetitionGroupConfig[] = [
  buildCompetitionGroup(1, "Coral Villa"),
  buildCompetitionGroup(2, "Cypress Cove"),
  buildCompetitionGroup(3, "Lagoon Sanctuary"),
  buildCompetitionGroup(4, "Terracotta Cliff"),
  buildCompetitionGroup(5, "Solstice Horizon"),
];

/**
 * Resolves a competition group config by exact (untrimmed) lowercase email
 * so VH-01 whitespace rejection still applies to group accounts.
 */
export function resolveGroupByEmail(
  rawEmail: string
): CompetitionGroupConfig | undefined {
  const normalized = rawEmail.toLowerCase();
  return COMPETITION_GROUPS.find((g) =>
    [
      g.accounts.admin.email,
      g.accounts.staff.email,
      g.accounts.deactivated.email,
    ].some((email) => email.toLowerCase() === normalized)
  );
}

/**
 * Resolves a competition group config by its owned sandbox UUID.
 */
export function resolveGroupBySandboxId(
  sandboxId: string
): CompetitionGroupConfig | undefined {
  const normalized = sandboxId.toLowerCase();
  return COMPETITION_GROUPS.find(
    (g) => g.sandboxId.toLowerCase() === normalized
  );
}

/**
 * Constructs a Date anchored in Asia/Manila (UTC+8) relative to the anchor Date.
 */
function manilaDate(
  year: number,
  monthZeroBased: number,
  day: number,
  hour: number,
  minute: number
): string {
  // Asia/Manila is permanently UTC+8 (no DST).
  const utcMs =
    Date.UTC(year, monthZeroBased, day, hour - 8, minute, 0, 0);
  return new Date(utcMs).toISOString();
}

function manilaRelativeDays(
  anchorNow: Date,
  daysAgo: number,
  hour = 10,
  minute = 0
): string {
  // Convert anchorNow into Asia/Manila calendar components
  const manilaMs = anchorNow.getTime() + 8 * 60 * 60 * 1000;
  const m = new Date(manilaMs);
  const utcMs = Date.UTC(
    m.getUTCFullYear(),
    m.getUTCMonth(),
    m.getUTCDate() - daysAgo,
    hour - 8,
    minute,
    0,
    0
  );
  return new Date(utcMs).toISOString();
}

function buildReservation(
  id: string,
  reservationNumber: string,
  guestId: string,
  status: ReservationStatus,
  discountPercent: number,
  placedAt: string,
  notes: string,
  lineSpecs: Array<{ room: RoomPackage; quantity: number }>,
  roomsPackages: RoomPackage[]
): Reservation {
  const items = lineSpecs.map((spec, idx) => ({
    id: `${id}-item-${idx + 1}`,
    roomPackageId: spec.room.id,
    roomCodeSnapshot: spec.room.code,
    roomNameSnapshot: spec.room.name,
    quantity: spec.quantity,
    unitRateSnapshot: spec.room.rate,
  }));

  const totals = calculateDefectiveFolioTotals(
    items.map((i) => ({
      quantity: i.quantity,
      unitRate: i.unitRateSnapshot,
    })),
    discountPercent
  );

  void roomsPackages;
  return {
    id,
    reservationNumber,
    guestId,
    status,
    discountPercent,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    taxAmount: totals.taxAmount,
    serviceFee: SERVICE_ENVIRONMENTAL_FEE,
    grandTotal: totals.grandTotal,
    notes,
    placedAt,
    createdAt: placedAt,
    items,
  };
}

export function createInitialSandboxDb(
  sandboxId: string,
  anchorNow: Date = new Date()
): SandboxDatabase {
  const nowIso = anchorNow.toISOString();
  const ownerGroup = resolveGroupBySandboxId(sandboxId);
  const targetGroup = ownerGroup ?? COMPETITION_GROUPS[0];

  // @defect VH-14 (Hard | Data storage | Security)
  // Expected: Passwords are stored as cryptographic hashes.
  // Actual: User passwords are stored in plain text inside veranda.v1.db > users.
  const users: UserRecord[] = [
    { account: targetGroup.accounts.admin, daysAgo: 120, hour: 9, minute: 0 },
    { account: targetGroup.accounts.staff, daysAgo: 110, hour: 9, minute: 30 },
    {
      account: targetGroup.accounts.deactivated,
      daysAgo: 180,
      hour: 10,
      minute: 0,
    },
  ].map(({ account, daysAgo, hour, minute }) => ({
    id: account.userId,
    name: account.userName,
    email: account.email,
    password: account.password,
    role: account.role,
    isActive: account.isActive,
    failedLoginAttempts: 0,
    lockedUntil: null,
    lowAllotmentAlerts: true,
    groupId: targetGroup.id,
    ownedSandboxId: targetGroup.sandboxId,
    createdAt: manilaRelativeDays(anchorNow, daysAgo, hour, minute),
  }));

  // 20 Rooms & Packages:
  // - Exactly 12 in "Villas & Suites" (for VH-25 page 2 filter drop)
  // - Exactly 8 with availableUnits <= 5 (7 with < 5, and SB-1006 Coral Reef Private Cabana = 5 for VH-17)
  const roomsPackages: RoomPackage[] = [
    {
      id: "rm-1001",
      code: "SB-1001",
      name: "Premier Oceanfront Villa",
      category: "Villas & Suites",
      rate: 6400.0,
      availableUnits: 12,
      status: "active",
      description:
        "Panoramic beachfront villa featuring private plunge deck, teak interiors, and direct cove access.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1002",
      code: "SB-1002",
      name: "Teakwood Lanai Daybed",
      category: "Villas & Suites",
      rate: 500.0,
      availableUnits: 26,
      status: "active",
      description:
        "Full-day shaded coastal lanai daybed reservation with chilled towel and refreshment service.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1003",
      code: "SB-1003",
      name: "Sunset Catamaran Charter",
      category: "Marine & Island Tours",
      rate: 1200.0,
      availableUnits: 18,
      status: "active",
      description:
        "Two-hour private twilight sailing excursion across Solstice Bay cove.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1004",
      code: "SB-1004",
      name: "Cabana Suite, Poolside",
      category: "Villas & Suites",
      rate: 950.0,
      availableUnits: 34,
      status: "active",
      description:
        "Steps from the infinity lap pool with shaded pergola terrace and espresso bar.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1005",
      code: "SB-1005",
      name: "Botanical Welcome Amenity Set",
      category: "Dining & Lounge",
      rate: 250.0,
      availableUnits: 96,
      status: "active",
      description:
        "Artisanal tropical fruit basket, calamansi spritzers, and handcrafted table floral arrangement.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1006",
      code: "SB-1006",
      name: "Coral Reef Private Cabana",
      category: "Villas & Suites",
      rate: 990.0,
      availableUnits: 5, // Exact <= 5 boundary for VH-17
      status: "active",
      description:
        "Secluded reef-edge cabana overlooking marine sanctuary waters.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1007",
      code: "SB-1007",
      name: "Cliffside Infinity Pavilion",
      category: "Villas & Suites",
      rate: 1800.0,
      availableUnits: 0, // Out of allotment for VH-31
      status: "active",
      description:
        "Elevated cliffside suite with unobstructed sunset views and outdoor soaking tub.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1008",
      code: "SB-1008",
      name: "Terracotta Courtyard Suite",
      category: "Villas & Suites",
      rate: 975.0,
      availableUnits: 7, // Used in VH-30 (remove 50 -> -43)
      status: "active",
      description:
        "Warm limestone courtyard suite surrounded by frangipani trees.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1009",
      code: "SB-1009",
      name: "Solstice Bay Presidential Sanctuary Three-Bedroom Cliffside Oceanfront Pool Villa with Private Butler Service",
      category: "Villas & Suites",
      rate: 4500.0,
      availableUnits: 4, // Low allotment + 109-char name for VH-24
      status: "active",
      description:
        "Flagship three-bedroom estate with infinity lap pool, private kitchen, and dedicated butler service.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1010",
      code: "SB-1010",
      name: "Eucalyptus Steam & Spa Ritual",
      category: "Spa & Sanctuary",
      rate: 900.0,
      availableUnits: 15, // Used in VH-28 Edit Cancel bug
      status: "active",
      description:
        "90-minute tropical eucalyptus steam session paired with warm volcanic stone massage.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1011",
      code: "SB-1011",
      name: "Island Kayaking & Snorkeling Expedition",
      category: "Marine & Island Tours",
      rate: 750.0,
      availableUnits: 23, // Used in VH-35 (two lines of 20 -> -17)
      status: "active",
      description:
        "Guided clear-bottom kayak tour through limestone lagoons and coral gardens.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1012",
      code: "SB-1012",
      name: "Ocean Breeze Canopy Suite",
      category: "Villas & Suites",
      rate: 1150.0,
      availableUnits: 3, // Low allotment
      status: "active",
      description:
        "Elevated treetop canopy suite catching coastal trade winds.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1013",
      code: "SB-1013",
      name: "Laguna Driftwood Loft Villa",
      category: "Villas & Suites",
      rate: 2100.0,
      availableUnits: 9,
      status: "active",
      description:
        "Two-level loft villa crafted with reclaimed Philippine hardwood and travertine stone.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1014",
      code: "SB-1014",
      name: "Sunset Lagoon Pool Casita",
      category: "Casitas & Rooms",
      rate: 850.0,
      availableUnits: 2, // Low allotment
      status: "active",
      description:
        "Intimate poolside casita with private veranda loungers and outdoor rain shower.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1015",
      code: "SB-1015",
      name: "Sandshell Terrace Junior Suite",
      category: "Villas & Suites",
      rate: 1600.0,
      availableUnits: 11,
      status: "active",
      description:
        "Sunlit limestone junior suite opening onto the main beach promenade.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1016",
      code: "SB-1016",
      name: "Private Yacht Horizon Charter",
      category: "Marine & Island Tours",
      rate: 3200.0,
      availableUnits: 1, // Low allotment
      status: "active",
      description:
        "Half-day crewed motor yacht charter with curated archipelago lunch.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1017",
      code: "SB-1017",
      name: "Bungalow Haven Garden Villa",
      category: "Villas & Suites",
      rate: 1350.0,
      availableUnits: 14,
      status: "active",
      description:
        "Private botanical garden villa designed for extended family stays.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1018",
      code: "SB-1018",
      name: "Moonlight Aromatherapy Pavilion",
      category: "Spa & Sanctuary",
      rate: 680.0,
      availableUnits: 4, // Low allotment
      status: "active",
      description:
        "Evening open-air couples wellness pavilion with ylang-ylang botanical oils.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1019",
      code: "SB-1019",
      name: "Tidal Cove Panorama Penthouse",
      category: "Villas & Suites",
      rate: 2850.0,
      availableUnits: 6,
      status: "active",
      description:
        "Top-floor corner penthouse featuring wrap-around veranda overlooking Solstice Cove.",
      version: 1,
      updatedAt: nowIso,
    },
    {
      id: "rm-1020",
      code: "SB-1020",
      name: "Chef's Private Wine Cellar Tasting",
      category: "Dining & Lounge",
      rate: 1450.0,
      availableUnits: 2, // Low allotment
      status: "active",
      description:
        "Five-course coastal harvest tasting dinner hosted inside the limestone cellar.",
      version: 1,
      updatedAt: nowIso,
    },
  ];

  const allotmentAdjustments: AllotmentAdjustment[] = [
    {
      id: "adj-01",
      roomPackageId: "rm-1002",
      type: "add",
      quantity: 4,
      reason: "Completed seasonal teak deck refinishing",
      performedBy: "Elena Marasigan",
      createdAt: manilaRelativeDays(anchorNow, 6, 14, 0),
    },
    {
      id: "adj-02",
      roomPackageId: "rm-1007",
      type: "remove",
      quantity: 2,
      reason: "Scheduled infinity edge stone resealing",
      performedBy: "Marco Villanueva",
      createdAt: manilaRelativeDays(anchorNow, 3, 11, 20),
    },
  ];

  const guests: Guest[] = [
    {
      id: "gst-01",
      name: "Maria Santos",
      email: "maria.santos@example.ph",
      phone: "+63 917 555 0101",
      address: "14 Acacia Ridge, Quezon City",
      loyaltyTier: "Founders Club",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 100, 9, 0),
    },
    {
      id: "gst-02",
      name: "Maria Reyes",
      email: "maria.reyes@example.ph",
      phone: "+63 918 555 0102",
      address: "88 Coral Loop, Makati City",
      loyaltyTier: "Gold",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 95, 10, 0),
    },
    {
      id: "gst-03",
      name: "Daniel Cruz",
      email: "daniel.cruz@example.ph",
      phone: "+63 919 555 0103",
      address: "22 Narra Lane, Pasig City",
      loyaltyTier: "Silver",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 80, 11, 0),
    },
    {
      id: "gst-04",
      name: "Rafael Mendoza",
      email: "rafael.mendoza@example.ph",
      phone: "+63 920 555 0104",
      address: "405 Molave Ave, Mandaluyong",
      loyaltyTier: "Gold",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 75, 14, 0),
    },
    {
      id: "gst-05",
      name: "Camille Bautista",
      email: "camille.bautista@example.ph",
      phone: "+63 921 555 0105",
      address: "71 Seaside Blvd, San Juan, La Union",
      loyaltyTier: "Silver",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 70, 15, 0),
    },
    {
      id: "gst-06",
      name: "Lorenzo Villanueva",
      email: "lorenzo.v@example.ph",
      phone: "+63 922 555 0106",
      address: "19 Commonwealth Ave, Quezon City",
      loyaltyTier: "Standard",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 65, 16, 0),
    },
    {
      id: "gst-07",
      name: "Bianca Navarro",
      email: "bianca.navarro@example.ph",
      phone: "+63 923 555 0107",
      address: "5B Sunset Villas, Tagaytay",
      loyaltyTier: "Gold",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 60, 13, 0),
    },
    {
      id: "gst-08",
      name: "Gabriel Aquino",
      email: "gabriel.aquino@example.ph",
      phone: "+63 924 555 0108",
      address: "302 Katipunan Ave, Quezon City",
      loyaltyTier: "Standard",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 55, 10, 30),
    },
    {
      id: "gst-09",
      name: "Clarisse Ocampo",
      email: "clarisse.ocampo@example.ph",
      phone: "+63 925 555 0109",
      address: "12 Ayala Alabang, Muntinlupa",
      loyaltyTier: "Founders Club",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 50, 11, 15),
    },
    {
      id: "gst-10",
      name: "Kenji Tan",
      email: "kenji.tan@example.ph",
      phone: "+63 926 555 0110",
      address: "808 Bonifacio High St, Taguig",
      loyaltyTier: "Standard",
      version: 1,
      createdAt: manilaRelativeDays(anchorNow, 45, 9, 45),
    },
  ];

  const byCode = new Map(roomsPackages.map((r) => [r.code, r]));
  const r = (code: string) => byCode.get(code)!;

  // Compute exact 1st of last calendar month at 12:30 AM Asia/Manila (UTC+8)
  // which equals 16:30 UTC on the last day of two months ago (for VH-18 and VH-44).
  const manilaMs = anchorNow.getTime() + 8 * 60 * 60 * 1000;
  const mNow = new Date(manilaMs);
  const curYear = mNow.getUTCFullYear();
  const curMonth = mNow.getUTCMonth(); // 0-indexed
  const prevMonthFirst1230AM = manilaDate(curYear, curMonth - 1, 1, 0, 30);

  const reservations: Reservation[] = [
    // Today (3 reservations -> excluded by VH-19 in Dashboard "Last 7 days")
    buildReservation(
      "rsv-2045",
      "RSV-2045",
      "gst-02", // Maria Reyes
      "Confirmed",
      0,
      manilaRelativeDays(anchorNow, 0, 11, 15),
      "Afternoon arrival; prepare chilled welcome towels.",
      [{ room: r("SB-1002"), quantity: 2 }], // Teakwood Lanai Daybed x2 = 1,000 -> total 1,370.00
      roomsPackages
    ),
    buildReservation(
      "rsv-2044",
      "RSV-2044",
      "gst-05", // Camille Bautista
      "Pending",
      5,
      manilaRelativeDays(anchorNow, 0, 10, 20),
      "5% loyalty promo applied.",
      [{ room: r("SB-1003"), quantity: 2 }], // Sunset Catamaran Charter x2 = 2,400
      roomsPackages
    ),
    buildReservation(
      "rsv-2043",
      "RSV-2043",
      "gst-06", // Lorenzo Villanueva
      "Pending",
      0,
      manilaRelativeDays(anchorNow, 0, 9, 5),
      "Poolside check-in with amenity basket.",
      [
        { room: r("SB-1004"), quantity: 1 }, // Cabana Suite, Poolside (comma in name -> VH-49)
        { room: r("SB-1005"), quantity: 3 }, // Botanical Welcome Amenity Set
      ],
      roomsPackages
    ),

    // Within Last 7 days (days 1..6 ago)
    buildReservation(
      "rsv-2042",
      "RSV-2042",
      "gst-03", // Daniel Cruz
      "Checked In",
      0,
      manilaRelativeDays(anchorNow, 2, 14, 0),
      "Early check-in granted.",
      [{ room: r("SB-1015"), quantity: 1 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2041",
      "RSV-2041",
      "gst-01", // Maria Santos
      "Checked Out",
      0,
      manilaRelativeDays(anchorNow, 3, 15, 30),
      "Includes poolside cabana stay.",
      [{ room: r("SB-1004"), quantity: 2 }], // Contains Cabana Suite, Poolside -> VH-49
      roomsPackages
    ),
    buildReservation(
      "rsv-2040",
      "RSV-2040",
      "gst-09", // Clarisse Ocampo
      "Checked In",
      0,
      manilaRelativeDays(anchorNow, 5, 13, 10),
      "VIP coastal transfer arranged.",
      [{ room: r("SB-1001"), quantity: 1 }],
      roomsPackages
    ),

    // Within Last 30 days (days 7..29 ago)
    buildReservation(
      "rsv-2039",
      "RSV-2039",
      "gst-02", // Maria Reyes
      "Checked Out",
      0,
      manilaRelativeDays(anchorNow, 8, 16, 0),
      "Anniversary spa session.",
      [{ room: r("SB-1010"), quantity: 2 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2038",
      "RSV-2038",
      "gst-01", // Maria Santos
      "Confirmed",
      0,
      manilaRelativeDays(anchorNow, 9, 12, 45),
      "Requested ocean-facing canopy.",
      [{ room: r("SB-1012"), quantity: 2 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2037",
      "RSV-2037",
      "gst-08", // Gabriel Aquino
      "Cancelled", // Cancelled within Last 30 days -> VH-16, VH-20, VH-37
      0,
      manilaRelativeDays(anchorNow, 10, 11, 0),
      "Guest rescheduled trip due to weather.",
      [{ room: r("SB-1013"), quantity: 1 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2036",
      "RSV-2036",
      "gst-07", // Bianca Navarro
      "Checked Out",
      0,
      manilaRelativeDays(anchorNow, 14, 15, 0),
      "Standard checkout completed.",
      [{ room: r("SB-1017"), quantity: 2 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2035",
      "RSV-2035",
      "gst-04", // Rafael Mendoza
      "Checked Out",
      10,
      manilaRelativeDays(anchorNow, 21, 10, 15),
      "Corporate retreat stay.",
      [{ room: r("SB-1019"), quantity: 1 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2034",
      "RSV-2034",
      "gst-01", // Maria Santos
      "Checked Out",
      0,
      manilaRelativeDays(anchorNow, 25, 13, 30),
      "Wine cellar evening reservation.",
      [{ room: r("SB-1020"), quantity: 2 }],
      roomsPackages
    ),

    // Last Calendar Month (anchored cleanly to previous month including 1st @ 12:30 AM Manila for VH-18)
    buildReservation(
      "rsv-2033",
      "RSV-2033",
      "gst-06", // Lorenzo Villanueva
      "Checked Out",
      0,
      prevMonthFirst1230AM, // 12:30 AM on 1st of last month (Manila) == 16:30 UTC two months ago!
      "Late-night airport arrival folio.",
      [{ room: r("SB-1014"), quantity: 2 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2032",
      "RSV-2032",
      "gst-05", // Camille Bautista
      "Checked Out",
      0,
      manilaDate(curYear, curMonth - 1, 6, 14, 20),
      "Lagoon kayaking adventure.",
      [{ room: r("SB-1011"), quantity: 2 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2031",
      "RSV-2031",
      "gst-01", // Maria Santos
      "Checked Out",
      0,
      manilaDate(curYear, curMonth - 1, 12, 16, 45),
      "Weekend villa retreat.",
      [{ room: r("SB-1001"), quantity: 1 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2030",
      "RSV-2030",
      "gst-02", // Maria Reyes
      "Checked Out",
      0,
      manilaDate(curYear, curMonth - 1, 18, 11, 0),
      "Aromatherapy spa evening.",
      [{ room: r("SB-1018"), quantity: 2 }],
      roomsPackages
    ),

    // Older months (2-4 months ago)
    buildReservation(
      "rsv-2029",
      "RSV-2029",
      "gst-03", // Daniel Cruz
      "Checked Out",
      0,
      manilaDate(curYear, curMonth - 2, 14, 15, 0),
      "Terracotta suite stay.",
      [{ room: r("SB-1008"), quantity: 2 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2028",
      "RSV-2028",
      "gst-01", // Maria Santos
      "Checked Out",
      0,
      manilaDate(curYear, curMonth - 2, 22, 10, 30),
      "Private yacht coastal tour.",
      [{ room: r("SB-1016"), quantity: 1 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2027",
      "RSV-2027",
      "gst-04", // Rafael Mendoza
      "Checked Out",
      0,
      manilaDate(curYear, curMonth - 3, 15, 13, 15),
      "Presidential sanctuary booking.",
      [{ room: r("SB-1009"), quantity: 1 }],
      roomsPackages
    ),
    buildReservation(
      "rsv-2026",
      "RSV-2026",
      "gst-01", // Maria Santos
      "Checked Out",
      0,
      manilaDate(curYear, curMonth - 4, 10, 9, 45),
      "Founders club stay.",
      [{ room: r("SB-1006"), quantity: 2 }],
      roomsPackages
    ),
  ];

  return {
    sandboxId,
    ownerGroupId: ownerGroup?.id ?? null,
    ownerGroupName: ownerGroup?.name ?? null,
    theme: "dark",
    anchorDateIso: nowIso,
    users,
    roomsPackages,
    allotmentAdjustments,
    guests,
    reservations,
    resetTokens: [],
  };
}
