"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSandbox } from "@/lib/store/sandbox-store";

export default function HomePage() {
  const router = useRouter();
  const { isReady, session } = useSandbox();

  useEffect(() => {
    if (!isReady) return;
    if (session) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [isReady, session, router]);

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center text-sm text-[var(--ink-muted)]">
      Redirecting to Veranda PMS...
    </div>
  );
}
