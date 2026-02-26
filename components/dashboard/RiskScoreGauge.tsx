"use client";

import { useEffect, useRef } from "react";
import { cn, scoreToRiskLevel, getRiskLevelLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { RiskLevel } from "@/types/worker";

interface RiskScoreGaugeProps {
  score: number;
  riskLevel?: RiskLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { svgSize: 100, strokeWidth: 8, radius: 38, fontSize: "text-xl" },
  md: { svgSize: 160, strokeWidth: 10, radius: 62, fontSize: "text-3xl" },
  lg: { svgSize: 200, strokeWidth: 12, radius: 78, fontSize: "text-5xl" },
};

export function RiskScoreGauge({
  score,
  riskLevel,
  size = "md",
  showLabel = true,
  className,
}: RiskScoreGaugeProps) {
  const { svgSize, strokeWidth, radius, fontSize } = sizeConfig[size];
  const center = svgSize / 2;
  const level = riskLevel ?? scoreToRiskLevel(score);

  // Arc is 270 degrees (from 135deg to 405deg = 45deg)
  const startAngle = 135;
  const endAngle = 405;
  const totalAngle = endAngle - startAngle;
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const scorePercent = Math.max(0, Math.min(100, score)) / 100;
  const fillLength = scorePercent * arcLength;
  const gapLength = circumference - arcLength;

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle - 0.001);

  const arcPath = `
    M ${start.x} ${start.y}
    A ${radius} ${radius} 0 1 1 ${end.x} ${end.y}
  `;

  const badgeVariantMap: Record<RiskLevel, "default" | "secondary" | "outline" | "destructive"> = {
    LOW: "outline",
    MEDIUM: "secondary",
    HIGH: "default",
    CRITICAL: "destructive",
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="relative">
        <svg width={svgSize} height={svgSize}>
          {/* Background track */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Score fill */}
          <path
            d={arcPath}
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${fillLength} ${circumference}`}
            style={{ transition: "stroke-dasharray 0.8s ease-out" }}
          />
        </svg>

        {/* Score number in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("font-bold tabular-nums leading-none", fontSize)}>
            {Math.round(score)}
          </span>
          <span className="text-xs text-muted-foreground mt-1">/ 100</span>
        </div>
      </div>

      {showLabel && (
        <Badge variant={badgeVariantMap[level]}>
          {getRiskLevelLabel(level)}
        </Badge>
      )}
    </div>
  );
}