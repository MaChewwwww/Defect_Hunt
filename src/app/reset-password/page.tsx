"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SplitEditorialAuthShell } from "@/components/hospitality/split-editorial-auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSandbox } from "@/lib/store/sandbox-store";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { resetPasswordWithToken } = useSandbox();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = resetPasswordWithToken(token, password, confirmPassword);
    if (!res.ok) {
      setError(res.error || "Unable to reset password.");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 800);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">
          Reset password
        </h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Set a new password for your Solstice Bay account.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          data-testid="reset-error"
          className="rounded-lg border border-red-500/30 bg-[var(--status-danger-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--status-danger-fg)]"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          data-testid="reset-success"
          className="rounded-lg border border-emerald-500/30 bg-[var(--status-success-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--status-success-fg)]"
        >
          Password updated! Redirecting to Sign in...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="rp-pass">New password</Label>
          <Input
            id="rp-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rp-confirm">Confirm password</Label>
          <Input
            id="rp-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>
        <Button type="submit" className="w-full h-10">
          Set new password
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--ink-muted)]">
        <Link
          href="/login"
          className="text-[var(--ink-primary)] font-medium hover:text-[var(--accent-primary)] underline-offset-4 hover:underline"
        >
          Return to Sign in
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <SplitEditorialAuthShell>
      <Suspense fallback={<div className="text-xs">Loading reset form...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </SplitEditorialAuthShell>
  );
}
