"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import {
  calculateDefectiveFolioTotals,
  LOW_ALLOTMENT_THRESHOLD,
} from "@/lib/domain/calculations";
import { createInitialSandboxDb } from "@/lib/domain/seed";
import type {
  AllotmentAdjustment,
  Guest,
  LoyaltyTier,
  Reservation,
  ReservationItem,
  ReservationStatus,
  RoomCategory,
  RoomPackage,
  SandboxDatabase,
  SessionState,
  UserRecord,
  UserRole,
} from "@/types/domain";

const STORAGE_SANDBOX_ID_KEY = "veranda.v1.sandbox_id";
const STORAGE_DB_KEY = "veranda.v1.db";
const STORAGE_SESSION_KEY = "veranda.v1.session";

export interface ActionResult<T = undefined> {
  ok: boolean;
  error?: string;
  data?: T;
}

interface SandboxContextValue {
  isReady: boolean;
  db: SandboxDatabase | null;
  session: SessionState | null;
  theme: "dark" | "light";
  setTheme: (next: "dark" | "light") => void;
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  resetDemoData: () => Promise<void>;
  login: (
    email: string,
    password: string,
    rememberMe: boolean
  ) => ActionResult<SessionState>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => ActionResult<SessionState>;
  logout: () => void;
  requestPasswordReset: (email: string) => ActionResult<{ token: string }>;
  resetPasswordWithToken: (
    token: string,
    password: string,
    confirmPassword: string
  ) => ActionResult;
  createUser: (input: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => ActionResult<UserRecord>;
  toggleUserActive: (userId: string) => ActionResult;
  saveRoomPackage: (
    input: {
      id?: string;
      code: string;
      name: string;
      category: RoomCategory;
      rate: number;
      availableUnits: number;
      status: "active" | "archived";
      description: string;
    },
    options?: { isCancelAction?: boolean }
  ) => ActionResult<RoomPackage>;
  adjustAllotment: (input: {
    roomPackageId: string;
    type: "add" | "remove";
    quantity: number;
    reason: string;
  }) => ActionResult;
  deleteRoomPackage: (roomId: string) => ActionResult;
  saveGuest: (input: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    loyaltyTier: LoyaltyTier;
  }) => ActionResult<Guest>;
  deleteGuest: (guestId: string) => ActionResult;
  createReservation: (input: {
    guestId: string;
    placedDateIso: string;
    discountPercent: number;
    notes: string;
    items: Array<{ roomPackageId: string; quantity: number }>;
  }) => ActionResult<Reservation>;
  updateReservationStatus: (
    reservationId: string,
    nextStatus: ReservationStatus
  ) => ActionResult;
  updateProfile: (name: string, email: string) => ActionResult;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => ActionResult;
  toggleLowAllotmentAlerts: (enabled: boolean) => void;
  lowAllotmentItems: RoomPackage[];
  currentUserRecord: UserRecord | null;
}

const SandboxContext = createContext<SandboxContextValue | null>(null);

function generateUuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function readLatestDbFromStorage(fallback: SandboxDatabase | null): SandboxDatabase {
  if (typeof window !== "undefined") {
    const raw = window.localStorage.getItem(STORAGE_DB_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as SandboxDatabase;
      } catch {
        // ignore parse error and fall through
      }
    }
  }
  if (fallback) return fallback;
  return createInitialSandboxDb(generateUuid(), new Date());
}

export function SandboxProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [db, setDb] = useState<SandboxDatabase | null>(null);
  const [session, setSession] = useState<SessionState | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // @defect VH-53 (Easy | Settings / theme | Functional)
  // Expected: Light/dark mode preference persists across page refresh.
  // Actual: Always initializes to "dark" on mount and ignores previous light-mode choice.
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  const setTheme = useCallback((next: "dark" | "light") => {
    setThemeState(next);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", next);
    }
    // Intentionally NOT persisted across page reload per VH-53
  }, []);

  const persistDb = useCallback((nextDb: SandboxDatabase) => {
    setDb(nextDb);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(nextDb));
      // Best-effort async cloud sync to Supabase
      void fetch("/api/sandbox/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId: nextDb.sandboxId, state: nextDb }),
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    // Force initial theme attribute to dark on page load (VH-53)
    document.documentElement.setAttribute("data-theme", "dark");

    let sandboxId = window.localStorage.getItem(STORAGE_SANDBOX_ID_KEY);
    if (!sandboxId) {
      sandboxId = generateUuid();
      window.localStorage.setItem(STORAGE_SANDBOX_ID_KEY, sandboxId);
    }

    let loadedDb: SandboxDatabase | null = null;
    const rawDb = window.localStorage.getItem(STORAGE_DB_KEY);
    if (rawDb) {
      try {
        loadedDb = JSON.parse(rawDb) as SandboxDatabase;
      } catch {
        loadedDb = null;
      }
    }

    if (!loadedDb) {
      loadedDb = createInitialSandboxDb(sandboxId, new Date());
      window.localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(loadedDb));
      void fetch("/api/sandbox/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId, state: loadedDb }),
      }).catch(() => {});
    }

    // Read session from localStorage
    let loadedSession: SessionState | null = null;
    const rawSession = window.localStorage.getItem(STORAGE_SESSION_KEY);
    if (rawSession) {
      try {
        loadedSession = JSON.parse(rawSession) as SessionState;
      } catch {
        loadedSession = null;
      }
    }

    // @defect VH-12 (Medium | Users | Functional)
    // If an active user was deactivated after signing in, sign them out on next page load.
    // Meanwhile VH-09 (inactive user who logged in with Remember me ticked) remains signed in.
    if (loadedSession && loadedDb) {
      const userRec = loadedDb.users.find(
        (u) => u.id === loadedSession!.userId
      );
      if (
        userRec &&
        !userRec.isActive &&
        !loadedSession.loggedInWhileInactive
      ) {
        loadedSession = null;
        window.localStorage.removeItem(STORAGE_SESSION_KEY);
      }
      // Note: @defect VH-13 — loadedSession.role is trusted directly from localStorage
      // rather than overwriting it with userRec.role!
    }

    const finalDb = loadedDb;
    const finalSession = loadedSession;
    queueMicrotask(() => {
      if (cancelled) return;
      setDb(finalDb);
      setSession(finalSession);
      setIsReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const resetDemoData = useCallback(async () => {
    const sandboxId =
      (typeof window !== "undefined" &&
        window.localStorage.getItem(STORAGE_SANDBOX_ID_KEY)) ||
      generateUuid();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_SANDBOX_ID_KEY, sandboxId);
    }

    const freshDb = createInitialSandboxDb(sandboxId, new Date());
    setDb(freshDb);
    setSession(null);
    setTheme("dark");

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_DB_KEY, JSON.stringify(freshDb));
      window.localStorage.removeItem(STORAGE_SESSION_KEY);
      window.sessionStorage.removeItem(STORAGE_SESSION_KEY);
    }

    try {
      await fetch("/api/sandbox/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sandboxId }),
      });
    } catch {
      // Offline / local fallback already populated
    }
    toast.success("Demo data has been restored to original seed values.");
  }, [setTheme]);

  const login = useCallback(
    (
      rawEmail: string,
      password: string,
      rememberMe: boolean
    ): ActionResult<SessionState> => {
      const latestDb = readLatestDbFromStorage(db);

      // @defect VH-01 (Medium | Auth / Login | Functional)
      // Expected: Leading and trailing spaces in email are trimmed before lookup.
      // Actual: Email is NOT trimmed, so pasted emails with spaces fail login.
      const emailLookup = rawEmail.toLowerCase();
      const userIdx = latestDb.users.findIndex(
        (u) => u.email.toLowerCase() === emailLookup
      );

      if (userIdx === -1) {
        // @defect VH-03 (Medium | Auth / Login | Security)
        // Expected: Identical error message for unknown email and wrong password.
        // Actual: Unknown email returns "Invalid email or password." while wrong password returns "Incorrect email or password."
        return { ok: false, error: "Invalid email or password." };
      }

      const user = latestDb.users[userIdx];

      // @defect VH-09 (Medium | Auth / Login | Security)
      // Expected: Deactivated accounts are blocked regardless of Remember me checkbox.
      // Actual: Blocked when Remember me is unchecked, but login succeeds when Remember me is checked.
      if (!user.isActive && !rememberMe) {
        return {
          ok: false,
          error: "This account has been deactivated. Contact your manager.",
        };
      }

      if (user.password !== password) {
        const nextAttempts = (user.failedLoginAttempts || 0) + 1;
        const nextUsers = [...latestDb.users];
        nextUsers[userIdx] = {
          ...user,
          failedLoginAttempts: nextAttempts,
          lockedUntil:
            nextAttempts >= 5
              ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
              : null,
        };
        persistDb({ ...latestDb, users: nextUsers });

        // @defect VH-04 (Hard | Auth / Login | Security)
        // Expected: Block login during lockout even when valid password is entered.
        // Actual: Displays "Too many attempts, try again later." on wrong passwords, but allows immediate login when valid password is submitted.
        if (nextAttempts >= 5) {
          return {
            ok: false,
            error: "Too many attempts, try again later.",
          };
        }

        // @defect VH-03: Distinct message reveals account existence
        return { ok: false, error: "Incorrect email or password." };
      }

      // Valid password (VH-04: intentionally skips checking lockedUntil / failedLoginAttempts >= 5!)
      const nextUsers = [...latestDb.users];
      nextUsers[userIdx] = {
        ...user,
        failedLoginAttempts: 0,
        lockedUntil: null,
      };
      persistDb({ ...latestDb, users: nextUsers });

      const newSession: SessionState = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        rememberMe,
        loggedInWhileInactive: !user.isActive && rememberMe,
        signedInAt: new Date().toISOString(),
      };

      setSession(newSession);
      if (typeof window !== "undefined") {
        // @defect VH-08 (Medium | Auth / Session | Security)
        // Expected: When Remember me is unchecked, store session in tab-scoped sessionStorage.
        // Actual: Always writes session to localStorage (veranda.v1.session) even when Remember me is unchecked.
        window.localStorage.setItem(
          STORAGE_SESSION_KEY,
          JSON.stringify(newSession)
        );
      }

      return { ok: true, data: newSession };
    },
    [db, persistDb]
  );

  const register = useCallback(
    (
      name: string,
      email: string,
      password: string,
      confirmPassword: string
    ): ActionResult<SessionState> => {
      const latestDb = readLatestDbFromStorage(db);
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();

      if (!trimmedName) {
        return { ok: false, error: "Enter your full name." };
      }
      if (!trimmedEmail || !trimmedEmail.includes("@")) {
        return { ok: false, error: "Enter a valid email address." };
      }
      if (password.length < 6) {
        return {
          ok: false,
          error: "Password must be at least 6 characters long.",
        };
      }

      // @defect VH-05 (Hard | Auth / Register | Validation)
      // Expected: Reject password mismatch regardless of length.
      // Actual: Mismatch is only checked when password is shorter than 12 characters.
      if (password.length < 12 && password !== confirmPassword) {
        return { ok: false, error: "Passwords do not match." };
      }

      // @defect VH-06 (Medium | Auth / Register | Validation)
      // Expected: Case-insensitive email uniqueness check.
      // Actual: Case-sensitive comparison allows "Admin@verandapms.test" even though "admin@verandapms.test" exists.
      const duplicate = latestDb.users.some((u) => u.email === trimmedEmail);
      if (duplicate) {
        return {
          ok: false,
          error: "An account with this email already exists.",
        };
      }

      const newUser: UserRecord = {
        id: `usr-${Date.now()}`,
        name: trimmedName,
        email: trimmedEmail,
        password, // @defect VH-14: plaintext password
        role: "staff",
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lowAllotmentAlerts: true,
        createdAt: new Date().toISOString(),
      };

      const nextDb: SandboxDatabase = {
        ...latestDb,
        users: [...latestDb.users, newUser],
      };
      persistDb(nextDb);

      const newSession: SessionState = {
        userId: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        rememberMe: false,
        signedInAt: new Date().toISOString(),
      };
      setSession(newSession);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_SESSION_KEY,
          JSON.stringify(newSession)
        );
      }

      return { ok: true, data: newSession };
    },
    [db, persistDb]
  );

  const logout = useCallback(() => {
    setSession(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_SESSION_KEY);
      window.sessionStorage.removeItem(STORAGE_SESSION_KEY);
    }
  }, []);

  const requestPasswordReset = useCallback(
    (email: string): ActionResult<{ token: string }> => {
      const latestDb = readLatestDbFromStorage(db);
      const user = latestDb.users.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (!user) {
        return {
          ok: false,
          error: "No account found with that email address.",
        };
      }
      const token = `rst-${generateUuid().slice(0, 12)}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const nextTokens = [
        ...latestDb.resetTokens,
        {
          token,
          userId: user.id,
          email: user.email,
          expiresAt,
          usedAt: null,
        },
      ];
      persistDb({ ...latestDb, resetTokens: nextTokens });
      return { ok: true, data: { token } };
    },
    [db, persistDb]
  );

  const resetPasswordWithToken = useCallback(
    (
      token: string,
      password: string,
      confirmPassword: string
    ): ActionResult => {
      const latestDb = readLatestDbFromStorage(db);
      const tokenIdx = latestDb.resetTokens.findIndex((t) => t.token === token);
      if (tokenIdx === -1) {
        return { ok: false, error: "Invalid or expired reset link." };
      }

      const tokenRec = latestDb.resetTokens[tokenIdx];
      if (Date.now() > new Date(tokenRec.expiresAt).getTime()) {
        return { ok: false, error: "This reset link has expired." };
      }

      // @defect VH-07 (Hard | Auth / Reset password | Security)
      // Expected: Reset link is single-use; second visit shows invalid/expired message.
      // Actual: Does NOT enforce or check tokenRec.usedAt, allowing reuse until 30-minute expiry.

      if (password.length < 6) {
        return {
          ok: false,
          error: "Password must be at least 6 characters long.",
        };
      }
      if (password !== confirmPassword) {
        return { ok: false, error: "Passwords do not match." };
      }

      const nextUsers = latestDb.users.map((u) =>
        u.id === tokenRec.userId ? { ...u, password } : u
      );
      persistDb({ ...latestDb, users: nextUsers });
      return { ok: true };
    },
    [db, persistDb]
  );

  const createUser = useCallback(
    (input: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
    }): ActionResult<UserRecord> => {
      const latestDb = readLatestDbFromStorage(db);
      const email = input.email.trim();
      if (!input.name.trim() || !email || input.password.length < 6) {
        return { ok: false, error: "Complete all user account fields." };
      }
      if (
        latestDb.users.some(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        )
      ) {
        return { ok: false, error: "Email is already registered." };
      }

      const created: UserRecord = {
        id: `usr-${Date.now()}`,
        name: input.name.trim(),
        email,
        password: input.password,
        role: input.role,
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        lowAllotmentAlerts: true,
        createdAt: new Date().toISOString(),
      };

      persistDb({ ...latestDb, users: [...latestDb.users, created] });
      toast.success("Staff account created.");
      return { ok: true, data: created };
    },
    [db, persistDb]
  );

  const toggleUserActive = useCallback(
    (userId: string): ActionResult => {
      const latestDb = readLatestDbFromStorage(db);
      // @defect VH-12 (Medium | Users | Functional)
      // Expected: Prevent currently signed-in Admin from deactivating their own account.
      // Actual: Allows self-deactivation; user is signed out on next page reload.
      const nextUsers = latestDb.users.map((u) =>
        u.id === userId ? { ...u, isActive: !u.isActive } : u
      );
      persistDb({ ...latestDb, users: nextUsers });
      const updated = nextUsers.find((u) => u.id === userId);
      toast.success(
        updated?.isActive ? "Account activated." : "Account deactivated."
      );
      return { ok: true };
    },
    [db, persistDb]
  );

  const saveRoomPackage = useCallback(
    (
      input: {
        id?: string;
        code: string;
        name: string;
        category: RoomCategory;
        rate: number;
        availableUnits: number;
        status: "active" | "archived";
        description: string;
      },
      options?: { isCancelAction?: boolean }
    ): ActionResult<RoomPackage> => {
      const latestDb = readLatestDbFromStorage(db);

      // @defect VH-28 (Hard | Rooms & Packages / Edit | Functional)
      // Expected: Clicking Cancel in Edit Room discards all changes.
      // Actual: When cancelling an edit, the name/category/description changes are discarded,
      // but the modified rate is still persisted!
      if (options?.isCancelAction && input.id) {
        const existingIdx = latestDb.roomsPackages.findIndex(
          (r) => r.id === input.id
        );
        if (existingIdx !== -1 && Number.isFinite(input.rate) && input.rate > 0) {
          const nextRooms = [...latestDb.roomsPackages];
          nextRooms[existingIdx] = {
            ...nextRooms[existingIdx],
            rate: Number(input.rate),
            updatedAt: new Date().toISOString(),
          };
          persistDb({ ...latestDb, roomsPackages: nextRooms });
          return { ok: true, data: nextRooms[existingIdx] };
        }
        return { ok: true };
      }

      // @defect VH-23 (Easy | Rooms & Packages / form | Validation)
      // Expected: Whitespace-only name rejected with "Enter a room or package name."
      // Actual: Checks input.name.length === 0 instead of trimming, so "   " is saved.
      if (input.name.length === 0) {
        return { ok: false, error: "Enter a room or package name." };
      }

      const trimmedCode = input.code.trim();
      if (!trimmedCode) {
        return { ok: false, error: "Enter a room or package code." };
      }

      // @defect VH-22 (Medium | Rooms & Packages / form | Validation)
      // Expected: Duplicate code check is case-insensitive.
      // Actual: Case-sensitive check allows "sb-1001" even though "SB-1001" exists.
      const dupCode = latestDb.roomsPackages.some(
        (r) => r.code === trimmedCode && r.id !== input.id
      );
      if (dupCode) {
        return { ok: false, error: "Room or package code already exists." };
      }

      if (!Number.isFinite(input.rate) || input.rate <= 0) {
        return { ok: false, error: "Rate must be greater than zero." };
      }

      // @defect VH-21 (Medium | Rooms & Packages / form | Validation)
      // Expected: Reject negative availableUnits ("Allotment cannot be negative").
      // Actual: Negative allotment values (e.g., -7) are accepted and saved.

      if (input.id) {
        const existingIdx = latestDb.roomsPackages.findIndex(
          (r) => r.id === input.id
        );
        if (existingIdx === -1) {
          return { ok: false, error: "Room or package not found." };
        }

        // @defect VH-60 (Hard | Rooms / Guests | Data)
        // Expected: Reject or merge stale concurrent edits based on record version.
        // Actual: Ignores version mismatch and silently overwrites latest changes from Tab A with Tab B's stale form values.
        const updatedRoom: RoomPackage = {
          ...latestDb.roomsPackages[existingIdx],
          code: trimmedCode,
          name: input.name,
          category: input.category,
          rate: Number(input.rate),
          availableUnits: Number(input.availableUnits),
          status: input.status,
          description: input.description,
          version: latestDb.roomsPackages[existingIdx].version + 1,
          updatedAt: new Date().toISOString(),
        };
        const nextRooms = [...latestDb.roomsPackages];
        nextRooms[existingIdx] = updatedRoom;
        persistDb({ ...latestDb, roomsPackages: nextRooms });

        // @defect VH-57 (Medium | Text | UI)
        // Actual: Misspelled toast "Room succesfully updated."
        toast.success("Room succesfully updated.");
        return { ok: true, data: updatedRoom };
      }

      const created: RoomPackage = {
        id: `rm-${Date.now()}`,
        code: trimmedCode,
        name: input.name,
        category: input.category,
        rate: Number(input.rate),
        availableUnits: Number(input.availableUnits),
        status: input.status,
        description: input.description,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      persistDb({
        ...latestDb,
        roomsPackages: [created, ...latestDb.roomsPackages],
      });
      toast.success("Room or package added.");
      return { ok: true, data: created };
    },
    [db, persistDb]
  );

  const adjustAllotment = useCallback(
    (input: {
      roomPackageId: string;
      type: "add" | "remove";
      quantity: number;
      reason: string;
    }): ActionResult => {
      const latestDb = readLatestDbFromStorage(db);
      const idx = latestDb.roomsPackages.findIndex(
        (r) => r.id === input.roomPackageId
      );
      if (idx === -1) {
        return { ok: false, error: "Room or package not found." };
      }
      if (!Number.isFinite(input.quantity) || input.quantity <= 0) {
        return { ok: false, error: "Quantity must be greater than zero." };
      }
      if (!input.reason.trim()) {
        return { ok: false, error: "Enter a reason for the adjustment." };
      }

      const room = latestDb.roomsPackages[idx];
      // @defect VH-30 (Medium | Rooms & Packages / Adjust allotment | Validation)
      // Expected: Reject removing more units than currently available.
      // Actual: Accepts removal quantity > availableUnits (e.g., 7 - 50 = -43).
      const nextUnits =
        input.type === "add"
          ? room.availableUnits + input.quantity
          : room.availableUnits - input.quantity;

      const nextRooms = [...latestDb.roomsPackages];
      nextRooms[idx] = {
        ...room,
        availableUnits: nextUnits,
        version: room.version + 1,
        updatedAt: new Date().toISOString(),
      };

      const logEntry: AllotmentAdjustment = {
        id: `adj-${Date.now()}`,
        roomPackageId: room.id,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason.trim(),
        performedBy: session?.name || "Resort Staff",
        createdAt: new Date().toISOString(),
      };

      persistDb({
        ...latestDb,
        roomsPackages: nextRooms,
        allotmentAdjustments: [logEntry, ...latestDb.allotmentAdjustments],
      });

      // @defect VH-57 (Medium | Text | UI)
      // Actual: Misspelled toast "Stock adjusment recorded."
      toast.success("Stock adjusment recorded.");
      return { ok: true };
    },
    [db, persistDb, session]
  );

  const deleteRoomPackage = useCallback(
    (roomId: string): ActionResult => {
      const latestDb = readLatestDbFromStorage(db);
      // @defect VH-11 (Medium | Access control / Room detail | Security)
      // No server/store role check blocks staff from deleting on /rooms/[id].
      const nextRooms = latestDb.roomsPackages.filter((r) => r.id !== roomId);
      persistDb({ ...latestDb, roomsPackages: nextRooms });
      toast.success("Room or package deleted.");
      return { ok: true };
    },
    [db, persistDb]
  );

  const saveGuest = useCallback(
    (input: {
      id?: string;
      name: string;
      email: string;
      phone: string;
      address: string;
      loyaltyTier: LoyaltyTier;
    }): ActionResult<Guest> => {
      const latestDb = readLatestDbFromStorage(db);
      if (!input.name.trim()) {
        return { ok: false, error: "Enter a guest name." };
      }
      if (!input.email.trim() || !input.email.includes("@")) {
        return { ok: false, error: "Enter a valid guest email." };
      }

      // @defect VH-45 (Easy | Guests / form | Validation)
      // Expected: Phone permits only digits, spaces, +, -, and parentheses.
      // Actual: Phone validation omitted; strings like "abc!!##xyz" are accepted.

      if (input.id) {
        const idx = latestDb.guests.findIndex((g) => g.id === input.id);
        if (idx === -1) return { ok: false, error: "Guest not found." };

        // @defect VH-60 (Hard | Rooms / Guests | Data)
        // Actual: Ignores version and overwrites latest changes from another tab.
        const updated: Guest = {
          ...latestDb.guests[idx],
          name: input.name.trim(),
          email: input.email.trim(),
          phone: input.phone.trim(),
          address: input.address.trim(),
          loyaltyTier: input.loyaltyTier,
          version: latestDb.guests[idx].version + 1,
        };
        const nextGuests = [...latestDb.guests];
        nextGuests[idx] = updated;
        persistDb({ ...latestDb, guests: nextGuests });
        toast.success("Guest profile updated.");
        return { ok: true, data: updated };
      }

      const created: Guest = {
        id: `gst-${Date.now()}`,
        name: input.name.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        address: input.address.trim(),
        loyaltyTier: input.loyaltyTier,
        version: 1,
        createdAt: new Date().toISOString(),
      };
      persistDb({ ...latestDb, guests: [created, ...latestDb.guests] });
      toast.success("Guest added to directory.");
      return { ok: true, data: created };
    },
    [db, persistDb]
  );

  const deleteGuest = useCallback(
    (guestId: string): ActionResult => {
      const latestDb = readLatestDbFromStorage(db);
      // @defect VH-46 (Medium | Guests / Reservations | Data)
      // Expected: Block deletion when guest has reservations (or keep snapshot guest name).
      // Actual: Deletes guest record while reservations retain dangling guestId, causing empty clickable cells in Reservations list.
      const nextGuests = latestDb.guests.filter((g) => g.id !== guestId);
      persistDb({ ...latestDb, guests: nextGuests });
      toast.success("Guest removed.");
      return { ok: true };
    },
    [db, persistDb]
  );

  const createReservation = useCallback(
    (input: {
      guestId: string;
      placedDateIso: string;
      discountPercent: number;
      notes: string;
      items: Array<{ roomPackageId: string; quantity: number }>;
    }): ActionResult<Reservation> => {
      const latestDb = readLatestDbFromStorage(db);
      const guest = latestDb.guests.find((g) => g.id === input.guestId);
      if (!guest) {
        return { ok: false, error: "Select a guest." };
      }
      if (input.items.length === 0) {
        return { ok: false, error: "Add at least one room or package line." };
      }

      // @defect VH-33 (Medium | Reservations / Create | Validation)
      // Expected: Discount must be between 0 and 100.
      // Actual: Out-of-range discounts (e.g., 150 or -20) are accepted.
      const discountPercent = Number.isFinite(input.discountPercent)
        ? input.discountPercent
        : 0;

      // @defect VH-42 (Medium | Reservations / dates | Validation / UI)
      // Expected: Reject future reservation dates.
      // Actual: Future dates are accepted without error.

      const roomMap = new Map(latestDb.roomsPackages.map((r) => [r.id, r]));
      const builtItems: ReservationItem[] = [];

      for (let i = 0; i < input.items.length; i++) {
        const line = input.items[i];
        const room = roomMap.get(line.roomPackageId);
        if (!room) {
          return { ok: false, error: "Selected room or package not found." };
        }

        // @defect VH-34 (Medium | Reservations / Create | Validation)
        // Expected: Quantity must be a whole number >= 1.
        // Actual: Only negative quantities (< 0) are rejected; 0 and fractional 2.5 are accepted.
        if (line.quantity < 0 || Number.isNaN(line.quantity)) {
          return {
            ok: false,
            error: "Line quantity cannot be negative.",
          };
        }

        // @defect VH-31 (Medium | Reservations / Create | Functional)
        // Out-of-allotment items (availableUnits <= 0) skip allotment check due to positive guard.
        // @defect VH-35 (Hard | Reservations / Create | Functional)
        // Checks each line independently instead of summing duplicate lines for the same roomPackageId.
        if (room.availableUnits > 0 && line.quantity > room.availableUnits) {
          return {
            ok: false,
            error: `Only ${room.availableUnits} available for ${room.name}.`,
          };
        }

        builtItems.push({
          id: `rsv-item-${Date.now()}-${i}`,
          roomPackageId: room.id,
          roomCodeSnapshot: room.code,
          roomNameSnapshot: room.name,
          quantity: line.quantity,
          unitRateSnapshot: room.rate,
        });
      }

      const totals = calculateDefectiveFolioTotals(
        builtItems.map((i) => ({
          quantity: i.quantity,
          unitRate: i.unitRateSnapshot,
        })),
        discountPercent
      );

      // Compute next consecutive reservation number (RSV-2046, RSV-2047...)
      const maxNum = latestDb.reservations.reduce((max, res) => {
        const match = /^RSV-(\d+)$/.exec(res.reservationNumber);
        return match ? Math.max(max, Number(match[1])) : max;
      }, 2045);
      const nextNum = maxNum + 1;
      const resId = `rsv-${nextNum}-${Math.random().toString(36).slice(2, 6)}`;
      const reservationNumber = `RSV-${nextNum}`;

      // Deduct allotment per line item (VH-31, VH-34, VH-35, VH-41)
      const nextRooms = latestDb.roomsPackages.map((room) => {
        const linesForRoom = builtItems.filter(
          (item) => item.roomPackageId === room.id
        );
        if (linesForRoom.length === 0) return room;
        const deducted = linesForRoom.reduce((sum, l) => sum + l.quantity, 0);
        return {
          ...room,
          availableUnits: Number((room.availableUnits - deducted).toFixed(2)),
          updatedAt: new Date().toISOString(),
        };
      });

      const createdReservation: Reservation = {
        id: resId,
        reservationNumber,
        guestId: guest.id,
        status: "Pending",
        discountPercent,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        serviceFee: totals.serviceFee,
        grandTotal: totals.grandTotal,
        notes: input.notes,
        placedAt: input.placedDateIso,
        createdAt: new Date().toISOString(),
        items: builtItems,
      };

      persistDb({
        ...latestDb,
        roomsPackages: nextRooms,
        reservations: [createdReservation, ...latestDb.reservations],
      });

      toast.success(`Reservation ${reservationNumber} created.`);
      return { ok: true, data: createdReservation };
    },
    [db, persistDb]
  );

  const updateReservationStatus = useCallback(
    (reservationId: string, nextStatus: ReservationStatus): ActionResult => {
      const latestDb = readLatestDbFromStorage(db);
      const resIdx = latestDb.reservations.findIndex(
        (r) => r.id === reservationId
      );
      if (resIdx === -1) {
        return { ok: false, error: "Reservation not found." };
      }

      const existing = latestDb.reservations[resIdx];
      const prevStatus = existing.status;
      if (prevStatus === nextStatus) {
        return { ok: true };
      }

      let nextRooms = [...latestDb.roomsPackages];

      // @defect VH-36 (Hard | Reservations / status | Functional)
      // Expected: Cancelling from Pending OR Confirmed restores allotment.
      // Actual: Cancelling from Pending restores allotment, but cancelling from Confirmed fails to restore allotment.
      if (nextStatus === "Cancelled" && prevStatus === "Pending") {
        nextRooms = nextRooms.map((room) => {
          const qty = existing.items
            .filter((i) => i.roomPackageId === room.id)
            .reduce((s, i) => s + i.quantity, 0);
          if (qty === 0) return room;
          return {
            ...room,
            availableUnits: Number((room.availableUnits + qty).toFixed(2)),
          };
        });
      }

      // @defect VH-38 (Hard | Reservations / status | Functional)
      // Expected: Transitioning Pending -> Confirmed leaves allotment unchanged (already deducted at creation).
      // Actual: Deducts allotment a second time when changing status from Pending to Confirmed!
      if (prevStatus === "Pending" && nextStatus === "Confirmed") {
        nextRooms = nextRooms.map((room) => {
          const qty = existing.items
            .filter((i) => i.roomPackageId === room.id)
            .reduce((s, i) => s + i.quantity, 0);
          if (qty === 0) return room;
          return {
            ...room,
            availableUnits: Number((room.availableUnits - qty).toFixed(2)),
          };
        });
      }

      // @defect VH-37 (Medium | Reservations / status | Functional)
      // Allows any status transition including backwards from Checked Out and reopening Cancelled.
      const nextReservations = [...latestDb.reservations];
      nextReservations[resIdx] = { ...existing, status: nextStatus };

      persistDb({
        ...latestDb,
        roomsPackages: nextRooms,
        reservations: nextReservations,
      });

      // @defect VH-57 (Medium | Text | UI)
      // Actual: Misspelled toast "Reservation status udpated."
      toast.success("Reservation status udpated.");
      return { ok: true };
    },
    [db, persistDb]
  );

  const updateProfile = useCallback(
    (name: string, email: string): ActionResult => {
      if (!session) return { ok: false, error: "Not authenticated." };
      const latestDb = readLatestDbFromStorage(db);
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      if (!trimmedName || !trimmedEmail) {
        return { ok: false, error: "Name and email are required." };
      }

      const nextUsers = latestDb.users.map((u) =>
        u.id === session.userId
          ? { ...u, name: trimmedName, email: trimmedEmail }
          : u
      );
      persistDb({ ...latestDb, users: nextUsers });

      // Update localStorage session for future page loads,
      // @defect VH-54 (Medium | Settings / Profile | Functional)
      // Expected: Updating Full name immediately updates topbar name/initials and Dashboard greeting.
      // Actual: Persists to storage, but intentionally does NOT update live React session state until page refresh!
      const updatedSession: SessionState = {
        ...session,
        name: trimmedName,
        email: trimmedEmail,
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          STORAGE_SESSION_KEY,
          JSON.stringify(updatedSession)
        );
      }

      toast.success("Profile updated.");
      return { ok: true };
    },
    [db, persistDb, session]
  );

  const changePassword = useCallback(
    (
      _currentPassword: string,
      newPassword: string,
      confirmPassword: string
    ): ActionResult => {
      if (!session) return { ok: false, error: "Not authenticated." };
      const latestDb = readLatestDbFromStorage(db);

      // @defect VH-52 (Medium | Settings / Change password | Security)
      // Expected: Verify currentPassword matches user's active password ("Current password is incorrect.").
      // Actual: Ignores wrong currentPassword and updates the password anyway.
      if (newPassword.length < 6) {
        return {
          ok: false,
          error: "New password must be at least 6 characters.",
        };
      }
      if (newPassword !== confirmPassword) {
        return { ok: false, error: "Passwords do not match." };
      }

      const nextUsers = latestDb.users.map((u) =>
        u.id === session.userId ? { ...u, password: newPassword } : u
      );
      persistDb({ ...latestDb, users: nextUsers });
      toast.success("Password changed.");
      return { ok: true };
    },
    [db, persistDb, session]
  );

  const toggleLowAllotmentAlerts = useCallback(
    (enabled: boolean) => {
      if (!session) return;
      const latestDb = readLatestDbFromStorage(db);
      const nextUsers = latestDb.users.map((u) =>
        u.id === session.userId ? { ...u, lowAllotmentAlerts: enabled } : u
      );
      persistDb({ ...latestDb, users: nextUsers });
      toast.success(
        enabled ? "Low allotment alerts enabled." : "Low allotment alerts disabled."
      );
    },
    [db, persistDb, session]
  );

  const currentUserRecord = useMemo(() => {
    if (!db || !session) return null;
    return db.users.find((u) => u.id === session.userId) ?? null;
  }, [db, session]);

  const lowAllotmentItems = useMemo(() => {
    if (!db) return [];
    return db.roomsPackages.filter(
      (r) => r.availableUnits <= LOW_ALLOTMENT_THRESHOLD
    );
  }, [db]);

  const value = useMemo<SandboxContextValue>(
    () => ({
      isReady,
      db,
      session,
      theme,
      setTheme,
      mobileDrawerOpen,
      setMobileDrawerOpen,
      sidebarCollapsed,
      setSidebarCollapsed,
      resetDemoData,
      login,
      register,
      logout,
      requestPasswordReset,
      resetPasswordWithToken,
      createUser,
      toggleUserActive,
      saveRoomPackage,
      adjustAllotment,
      deleteRoomPackage,
      saveGuest,
      deleteGuest,
      createReservation,
      updateReservationStatus,
      updateProfile,
      changePassword,
      toggleLowAllotmentAlerts,
      lowAllotmentItems,
      currentUserRecord,
    }),
    [
      isReady,
      db,
      session,
      theme,
      setTheme,
      mobileDrawerOpen,
      setMobileDrawerOpen,
      sidebarCollapsed,
      setSidebarCollapsed,
      resetDemoData,
      login,
      register,
      logout,
      requestPasswordReset,
      resetPasswordWithToken,
      createUser,
      toggleUserActive,
      saveRoomPackage,
      adjustAllotment,
      deleteRoomPackage,
      saveGuest,
      deleteGuest,
      createReservation,
      updateReservationStatus,
      updateProfile,
      changePassword,
      toggleLowAllotmentAlerts,
      lowAllotmentItems,
      currentUserRecord,
    ]
  );

  return (
    <SandboxContext.Provider value={value}>{children}</SandboxContext.Provider>
  );
}

export function useSandbox() {
  const ctx = useContext(SandboxContext);
  if (!ctx) {
    throw new Error("useSandbox must be used inside SandboxProvider");
  }
  return ctx;
}
