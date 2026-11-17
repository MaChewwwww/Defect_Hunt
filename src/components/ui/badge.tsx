import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--ink-primary)]",
        success:
          "border-emerald-500/25 bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
        info:
          "border-sky-500/25 bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
        warning:
          "border-amber-500/25 bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]",
        danger:
          "border-red-500/25 bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
        accent:
          "border-[#c87d4b]/30 bg-[#c87d4b]/15 text-[var(--accent-primary)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
