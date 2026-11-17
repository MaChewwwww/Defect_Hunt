"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SplitEditorialAuthShell } from "@/components/hospitality/split-editorial-auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSandbox } from "@/lib/store/sandbox-store";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useSandbox();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = register(name, email, password, confirmPassword);
    if (!res.ok) {
      setError(res.error || "Unable to create account.");
      return;
    }
    router.push("/dashboard");
  };

  return (
    <SplitEditorialAuthShell>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">Create account</h2>
        <p className="text-xs text-[var(--ink-muted)]">
          Register a new front-desk staff profile for Solstice Bay.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          data-testid="register-error"
          className="rounded-lg border border-red-500/30 bg-[var(--status-danger-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--status-danger-fg)]"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="reg-name">Full name</Label>
          <Input
            id="reg-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Rivera"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-email">Email</Label>
          <Input
            id="reg-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="concierge@verandapms.test"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-password">Password</Label>
          <Input
            id="reg-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 6 characters"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reg-confirm">Confirm password</Label>
          <Input
            id="reg-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
          />
        </div>
        <Button type="submit" className="w-full h-10">
          Create account
        </Button>
      </form>

      <div className="text-center text-xs text-[var(--ink-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[var(--ink-primary)] font-medium hover:text-[var(--accent-primary)] underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </div>
    </SplitEditorialAuthShell>
  );
}
