import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--ink-primary)] flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center space-y-4">
        <div className="font-mono-tabular text-xs uppercase tracking-widest text-[var(--accent-primary)]">
          404 &middot; Page Not Found
        </div>
        <h1 className="font-display text-3xl">We could not find that page.</h1>
        <p className="text-sm text-[var(--ink-secondary)]">
          The requested Veranda PMS route does not exist or may have moved.
        </p>
        <div className="pt-2">
          <Button asChild>
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
