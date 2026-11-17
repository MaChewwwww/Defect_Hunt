"use client";

import React from "react";
import {
  BedDouble,
  BarChart3,
  ReceiptText,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useSandbox } from "@/lib/store/sandbox-store";

export function SplitEditorialAuthShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resetDemoData } = useSandbox();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg-canvas)] text-[var(--ink-primary)] relative overflow-hidden">
      {/* Subtle architectural coastal backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(46, 155, 139, 0.14), transparent 42%), radial-gradient(circle at 85% 78%, rgba(200, 125, 75, 0.14), transparent 45%)",
        }}
      />

      {/* Top Brand Header */}
      <header className="relative z-10 px-6 py-5 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--accent-primary)] shadow-xs">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="1.75"
            >
              <path d="M4 19h16" />
              <path d="M6 19V11a6 6 0 0 1 12 0v8" />
              <path d="M9.5 19v-4a2.5 2.5 0 0 1 5 0v4" />
              <circle cx="12" cy="7" r="1" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-[var(--ink-primary)]">
              Veranda PMS
            </div>
            <div className="text-xs text-[var(--ink-muted)]">
              Solstice Bay Resort &amp; Villas
            </div>
          </div>
        </div>
      </header>

      {/* Main Asymmetric Split Content */}
      <main className="relative z-10 flex-1 mx-auto w-full max-w-6xl px-6 py-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Editorial Column */}
        <section className="lg:col-span-7 space-y-7">
          {/* Architectural Coastal Resort Motif */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="relative h-24 w-40 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-rail)] p-3 flex items-center justify-center overflow-hidden">
              <svg
                viewBox="0 0 160 80"
                fill="none"
                className="w-full h-full text-[var(--accent-secondary)]"
              >
                <path
                  d="M12 68 H148"
                  stroke="currentColor"
                  strokeOpacity="0.35"
                  strokeWidth="1.2"
                />
                <path
                  d="M32 68 V38 C32 22 46 14 60 14 C74 14 88 22 88 38 V68"
                  stroke="#c87d4b"
                  strokeWidth="1.5"
                />
                <path
                  d="M72 68 V44 C72 32 84 25 96 25 C108 25 120 32 120 44 V68"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="126"
                  cy="22"
                  r="7"
                  stroke="#c87d4b"
                  strokeOpacity="0.8"
                  strokeWidth="1.4"
                />
              </svg>
            </div>
            <div className="text-xs uppercase tracking-[0.18em] text-[var(--ink-muted)] font-medium">
              San Juan, La Union &middot; El Nido, Palawan
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="font-display text-4xl sm:text-5xl leading-[1.08] tracking-tight text-[var(--ink-primary)]">
              Room inventory, reservations, and folios in{" "}
              <span className="italic text-[var(--accent-primary)]">
                one composed workspace.
              </span>
            </h1>
            <p className="max-w-xl text-sm sm:text-base text-[var(--ink-secondary)] leading-relaxed">
              Veranda PMS keeps Solstice Bay Resort &amp; Villas room
              allotments, guest reservations, and official billing folios in
              sync so every concierge desk knows what is ready for arrival.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--accent-secondary)]">
                <BedDouble className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-[var(--ink-primary)]">
                Live room allotments
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--accent-primary)]">
                <ReceiptText className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-[var(--ink-primary)]">
                Folio billing &amp; VAT
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--accent-secondary)]">
                <BarChart3 className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-[var(--ink-primary)]">
                Occupancy &amp; revenue reports
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--bg-subtle)] text-[var(--accent-primary)]">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-[var(--ink-primary)]">
                Role-based concierge access
              </span>
            </div>
          </div>

          <p className="text-xs text-[var(--ink-muted)]">
            Solstice Bay Resort &amp; Villas is a fictional hospitality group.
            All guest and folio data in this environment is synthetic.
          </p>
        </section>

        {/* Right Auth Card Column */}
        <section className="lg:col-span-5 w-full max-w-md mx-auto">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-7 shadow-xl space-y-5">
            {children}

            {/* Demo Accounts Box */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 p-4 space-y-2.5 text-xs">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Demo Accounts
              </div>
              <div className="space-y-1.5 font-mono-tabular">
                <div>
                  <span className="font-sans font-semibold text-[var(--ink-primary)]">
                    Admin
                  </span>
                  <div className="text-[var(--ink-secondary)]">
                    admin@verandapms.test / Admin@123
                  </div>
                </div>
                <div>
                  <span className="font-sans font-semibold text-[var(--ink-primary)]">
                    Staff
                  </span>
                  <div className="text-[var(--ink-secondary)]">
                    staff@verandapms.test / Staff@123
                  </div>
                </div>
                <div>
                  <span className="font-sans font-semibold text-[var(--ink-primary)]">
                    Staff (deactivated)
                  </span>
                  <div className="text-[var(--ink-muted)]">
                    former@verandapms.test / Former@123
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with Reset Demo Data */}
      <footer className="relative z-10 border-t border-[var(--border-subtle)] px-6 py-3.5 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--ink-muted)]">
        <div className="hidden sm:block" />
        <div>Veranda PMS demo environment</div>
        <button
          type="button"
          onClick={() => void resetDemoData()}
          className="inline-flex items-center gap-1.5 text-[var(--ink-secondary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset demo data
        </button>
      </footer>
    </div>
  );
}
