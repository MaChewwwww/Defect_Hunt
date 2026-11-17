"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SplitEditorialAuthShell } from "@/components/hospitality/split-editorial-auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSandbox } from "@/lib/store/sandbox-store";

export default function LoginPage() {
  const router = useRouter();
  const { isReady, session, login } = useSandbox();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && session) {
      router.replace("/dashboard");
    }
  }, [isReady, session, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(email, password, rememberMe);
    if (!res.ok) {
      setError(res.error || "Invalid email or password.");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <SplitEditorialAuthShell>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Welcome back. Enter your Solstice Bay credentials to continue.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          data-testid="login-error"
          className="rounded-lg border border-red-500/30 bg-[var(--status-danger-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--status-danger-fg)]"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            name="email"
            type="text"
            autoComplete="email"
            placeholder="you@verandapms.test"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              // @defect VH-02 (Medium | Auth / Login | Usability)
              // Expected: Pressing Enter in either Email or Password submits the form.
              // Actual: Enter in Password does nothing; Enter in Email submits.
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer text-[var(--ink-secondary)]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent-primary)]"
            />
            Remember me
          </label>
          <Link
            href="/forgot-password"
            className="text-[var(--accent-primary)] hover:underline font-medium"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full h-10">
          Sign in
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--ink-muted)]">
        No account yet?{" "}
        <Link
          href="/register"
          className="text-[var(--ink-primary)] font-medium hover:text-[var(--accent-primary)] underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </div>
    </SplitEditorialAuthShell>
  );
}
