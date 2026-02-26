"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { cn, getRiskLevelLabel } from "@/lib/utils";
import type { RiskLevel } from "@/types/worker";

interface AlertBannerProps {
  riskLevel: RiskLevel;
  message: string;
  timestamp?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function AlertBanner({
  riskLevel,
  message,
  timestamp,
  dismissible = true,
  onDismiss,
  className,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const isCritical = riskLevel === "CRITICAL";
  const isHigh = riskLevel === "HIGH";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 text-sm",
        isCritical && "border-foreground bg-foreground text-background",
        isHigh && "border-foreground/60 bg-secondary",
        !isCritical && !isHigh && "border-border bg-secondary/50",
        className
      )}
      role="alert"
    >
      <AlertTriangle
        className={cn(
          "h-4 w-4 mt-0.5 shrink-0",
          isCritical ? "text-background" : "text-foreground",
          isCritical && "animate-pulse"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("font-semibold", isCritical ? "text-background" : "text-foreground")}>
            {getRiskLevelLabel(riskLevel)} Alert
          </span>
          {timestamp && (
            <span className={cn("text-xs", isCritical ? "text-background/70" : "text-muted-foreground")}>
              {timestamp}
            </span>
          )}
        </div>
        <p className={cn(isCritical ? "text-background/90" : "text-muted-foreground")}>
          {message}
        </p>
      </div>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className={cn(
            "shrink-0 opacity-70 hover:opacity-100 transition-opacity",
            isCritical ? "text-background" : "text-foreground"
          )}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}