"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck2,
  Users as UsersIcon,
  FileBarChart2,
  Shield,
  Settings,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  RotateCcw,
} from "lucide-react";
import { useSandbox } from "@/lib/store/sandbox-store";
import { getInitials } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/rooms", label: "Rooms & Packages", icon: BedDouble, adminOnly: false },
  { href: "/reservations", label: "Reservations", icon: CalendarCheck2, adminOnly: false },
  { href: "/guests", label: "Guests", icon: UsersIcon, adminOnly: false },
  { href: "/reports", label: "Reports", icon: FileBarChart2, adminOnly: false },
  { href: "/users", label: "Users", icon: Shield, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: false },
];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isReady,
    session,
    logout,
    theme,
    setTheme,
    mobileDrawerOpen: mobileOpen,
    setMobileDrawerOpen: setMobileOpen,
    sidebarCollapsed: collapsed,
    setSidebarCollapsed: setCollapsed,
    lowAllotmentItems,
    currentUserRecord,
    resetDemoData,
  } = useSandbox();

  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    if (isReady && !session) {
      router.replace("/login");
    }
  }, [isReady, session, router]);

  if (!isReady || !session) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center text-sm text-[var(--ink-muted)]">
        Loading Solstice Bay workspace...
      </div>
    );
  }

  // @defect VH-13 (Hard | Access control / Session | Security)
  // Expected: Role comes from authoritative user record in DB.
  // Actual: Trusts session.role directly from veranda.v1.session in localStorage.
  const effectiveRole = session.role;
  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.adminOnly || effectiveRole === "admin"
  );

  const alertsEnabled = currentUserRecord?.lowAllotmentAlerts !== false;

  const handleSignOut = () => {
    setMobileOpen(false);
    logout();
    router.push("/login");
  };

  const handleReset = async () => {
    setMobileOpen(false);
    await resetDemoData();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--ink-primary)]">
      {/* Desktop & Tablet Sidebar Rail (>= 640px) */}
      <aside
        className={`no-print hidden sm:flex flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-rail)] transition-all duration-200 shrink-0 ${
          collapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-2">
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Veranda PMS</div>
              <div className="text-[11px] text-[var(--ink-muted)] truncate">
                Solstice Bay Resort
              </div>
            </div>
          )}
          {/* @defect VH-59: Sidebar collapse toggle omits aria-label and title */}
          <button
            type="button"
            data-testid="sidebar-collapse-toggle"
            onClick={() => setCollapsed((c) => !c)}
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-primary)] cursor-pointer mx-auto sm:mx-0"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation Links (properly labelled even in collapsed rail per VH-59 note) */}
        <nav className="flex-1 p-3 space-y-1" aria-label="Primary Navigation">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--accent-primary)] text-white"
                    : "text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-primary)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Sign Out */}
        <div className="p-3 border-t border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--ink-primary)] cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer (< 640px) */}
      {mobileOpen && (
        <div
          className="no-print fixed inset-0 z-50 sm:hidden"
          data-testid="mobile-drawer"
        >
          {/* Backdrop closes drawer */}
          <div
            className="fixed inset-0 bg-black/60"
            data-testid="mobile-drawer-backdrop"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative z-10 w-64 h-full bg-[var(--bg-rail)] border-r border-[var(--border-subtle)] flex flex-col">
            <div className="h-14 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Veranda PMS</div>
                <div className="text-[11px] text-[var(--ink-muted)]">
                  Solstice Bay Resort
                </div>
              </div>
              {/* @defect VH-59: Drawer close button omits aria-label and title */}
              <button
                type="button"
                data-testid="mobile-drawer-close"
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  // @defect VH-58 (Medium | Layout / mobile drawer | UI)
                  // Expected: Tapping a navigation link closes the mobile drawer.
                  // Actual: Navigates to the route underneath while leaving the drawer open.
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-label={item.label}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-[var(--accent-primary)] text-white"
                        : "text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar (56px) */}
        <header className="no-print sticky top-0 z-30 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)] backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* @defect VH-59: Hamburger button omits aria-label and title */}
            <button
              type="button"
              data-testid="mobile-menu-trigger"
              onClick={() => setMobileOpen(true)}
              className="sm:hidden p-2 rounded-lg text-[var(--ink-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--ink-muted)] hidden md:block">
              Solstice Bay Resort &amp; Villas
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle (>= 640px) */}
            {/* @defect VH-59: Theme toggle button omits aria-label and title */}
            <button
              type="button"
              data-testid="topbar-theme-toggle"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden sm:inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              {/* @defect VH-59: Notification bell button omits aria-label and title */}
              <button
                type="button"
                data-testid="notification-bell-button"
                onClick={() => setBellOpen((o) => !o)}
                className="relative inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {/* @defect VH-55 (Hard | Notifications | Functional)
                    Expected: Badge disappears when Low allotment alerts are turned off in Settings.
                    Actual: Badge always renders lowAllotmentItems.length (8) even when alerts are disabled! */}
                {lowAllotmentItems.length > 0 && (
                  <span
                    data-testid="notification-bell-badge"
                    className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent-primary)] px-1 text-[10px] font-bold text-white font-mono-tabular"
                  >
                    {lowAllotmentItems.length}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div
                  data-testid="notification-bell-dropdown"
                  className="absolute right-0 mt-2 w-72 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xl p-3 z-50"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)]">
                    <span className="text-xs font-semibold">
                      Low Allotment Alerts
                    </span>
                    <button
                      type="button"
                      onClick={() => setBellOpen(false)}
                      className="text-xs text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  {!alertsEnabled || lowAllotmentItems.length === 0 ? (
                    <p className="py-4 text-center text-xs text-[var(--ink-muted)]">
                      You are all caught up.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 max-h-60 overflow-y-auto">
                      {lowAllotmentItems.map((room) => (
                        <li
                          key={room.id}
                          className="flex items-center justify-between text-xs rounded-md bg-[var(--bg-subtle)] px-2.5 py-2"
                        >
                          <span className="truncate pr-2 font-medium">
                            {room.name}
                          </span>
                          <span className="font-mono-tabular text-[var(--status-warn-fg)] shrink-0">
                            {room.availableUnits} left
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div
              data-testid="topbar-user-chip"
              className="flex items-center gap-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent-secondary)] text-[11px] font-bold text-white">
                {getInitials(session.name)}
              </span>
              <div className="hidden md:block text-left leading-tight">
                <div className="text-xs font-semibold text-[var(--ink-primary)]">
                  {session.name}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)]">
                  {effectiveRole}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="no-print border-t border-[var(--border-subtle)] px-6 py-3 flex items-center justify-between text-xs text-[var(--ink-muted)]">
          <span>Veranda PMS &middot; Solstice Bay Resort &amp; Villas</span>
          <button
            type="button"
            onClick={() => void handleReset()}
            className="inline-flex items-center gap-1.5 hover:text-[var(--accent-primary)] cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset demo data
          </button>
        </footer>
      </div>
    </div>
  );
}
