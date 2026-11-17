export type UserRole = "admin" | "staff";

export type RoomCategory =
  | "Villas & Suites"
  | "Casitas & Rooms"
  | "Marine & Island Tours"
  | "Spa & Sanctuary"
  | "Dining & Lounge";

export type ReservationStatus =
  | "Pending"
  | "Confirmed"
  | "Checked In"
  | "Checked Out"
  | "Cancelled";

export type LoyaltyTier = "Standard" | "Silver" | "Gold" | "Founders Club";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string; // @defect VH-14: plaintext password stored in db
  role: UserRole;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lowAllotmentAlerts: boolean;
  groupId?: string;
  ownedSandboxId?: string;
  createdAt: string;
}

export interface RoomPackage {
  id: string;
  code: string;
  name: string;
  category: RoomCategory;
  rate: number;
  availableUnits: number;
  status: "active" | "archived";
  description: string;
  version: number;
  updatedAt: string;
}

export interface AllotmentAdjustment {
  id: string;
  roomPackageId: string;
  type: "add" | "remove";
  quantity: number;
  reason: string;
  performedBy: string;
  createdAt: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  loyaltyTier: LoyaltyTier;
  version: number;
  createdAt: string;
}

export interface ReservationItem {
  id: string;
  roomPackageId: string;
  roomCodeSnapshot: string;
  roomNameSnapshot: string;
  quantity: number;
  unitRateSnapshot: number;
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  guestId: string;
  status: ReservationStatus;
  discountPercent: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceFee: number;
  grandTotal: number;
  notes: string;
  placedAt: string; // ISO-8601 UTC timestamp
  createdAt: string;
  items: ReservationItem[];
}

export interface PasswordResetToken {
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface SandboxDatabase {
  sandboxId: string;
  ownerGroupId?: string | null;
  ownerGroupName?: string | null;
  theme: "dark" | "light";
  anchorDateIso: string;
  users: UserRecord[];
  roomsPackages: RoomPackage[];
  allotmentAdjustments: AllotmentAdjustment[];
  guests: Guest[];
  reservations: Reservation[];
  resetTokens: PasswordResetToken[];
}

export interface SessionState {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  rememberMe: boolean;
  loggedInWhileInactive?: boolean;
  signedInAt: string;
}
