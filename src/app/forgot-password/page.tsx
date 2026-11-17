"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SplitEditorialAuthShell } from "@/components/hospitality/split-editorial-auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSandbox } from "@/lib/store/sandbox-store";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useSandbox();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = requestPasswordReset(email);
    if (!res.ok || !res.data) {
      setError(res.error || "Unable to send reset link.");
      return;
    }
    setGeneratedToken(res.data.token);
  };

  return (
    <SplitEditorialAuthShell>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Forgot password
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Enter your staff email to generate a 30-minute reset link.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-[var(--status-danger-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--status-danger-fg)]"
        >
          {error}
        </div>
      )}

      {generatedToken && (
        <div
          data-testid="reset-link-banner"
          className="rounded-lg border border-emerald-500/30 bg-[var(--status-success-bg)] p-3.5 space-y-2 text-xs"
        >
          <div className="font-semibold text-[var(--status-success-fg)]">
            Password reset link generated (valid 30 minutes)
          </div>
          <div className="font-mono-tabular break-all text-[var(--ink-secondary)]">
            /reset-password?token={generatedToken}
          </div>
          <div>
            <Button size="sm" asChild>
              <Link href={`/reset-password?token=${generatedToken}`}>
                Open reset link
              </Link>
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fp-email">Email</Label>
          <Input
            id="fp-email"
            type="email"
            placeholder="staff@verandapms.test"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full h-10">
          Send reset link
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--ink-muted)]">
        Remembered your password?{" "}
        <Link
          href="/login"
          className="text-[var(--ink-primary)] font-medium hover:text-[var(--accent-primary)] underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </SplitEditorialAuthShell>
  );
}
