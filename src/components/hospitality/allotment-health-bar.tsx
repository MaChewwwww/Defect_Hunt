import React from "react";
import { Badge } from "@/components/ui/badge";
import { LOW_ALLOTMENT_THRESHOLD } from "@/lib/domain/calculations";

export function AllotmentHealthBar({
  availableUnits,
}: {
  availableUnits: number;
}) {
  if (availableUnits <= 0) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="danger">Out of allotment</Badge>
        <span className="font-mono-tabular text-xs text-[var(--status-danger-fg)]">
          {availableUnits}
        </span>
      </div>
    );
  }

  if (availableUnits <= LOW_ALLOTMENT_THRESHOLD) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="warning">Low allotment</Badge>
        <span className="font-mono-tabular text-xs text-[var(--status-warn-fg)]">
          {availableUnits}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="success">In service</Badge>
      <span className="font-mono-tabular text-xs text-[var(--ink-secondary)]">
        {availableUnits}
      </span>
    </div>
  );
}
