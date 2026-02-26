"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/worker";

interface SiteRiskData {
  siteId: string;
  siteName: string;
  x: number; // 0-100 percentage position
  y: number;
  riskLevel: RiskLevel;
  workerCount: number;
  avgScore: number;
}

interface HeatmapWidgetProps {
  sites: SiteRiskData[];
  className?: string;
}

const riskOpacity: Record<RiskLevel, string> = {
  LOW: "opacity-20",
  MEDIUM: "opacity-40",
  HIGH: "opacity-70",
  CRITICAL: "opacity-100",
};

const riskSize: Record<RiskLevel, string> = {
  LOW: "w-4 h-4",
  MEDIUM: "w-5 h-5",
  HIGH: "w-6 h-6",
  CRITICAL: "w-8 h-8",
};

export function HeatmapWidget({ sites, className }: HeatmapWidgetProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Site Risk Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full aspect-[16/9] rounded-md bg-muted border overflow-hidden">
          {/* Grid lines */}
          <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 opacity-20">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="border border-dashed border-muted-foreground" />
            ))}
          </div>

          {/* Site dots */}
          {sites.map((site) => (
            <div
              key={site.siteId}
              className="absolute flex flex-col items-center group"
              style={{
                left: `${site.x}%`,
                top: `${site.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Pulse ring for critical */}
              {site.riskLevel === "CRITICAL" && (
                <div className="absolute rounded-full bg-foreground/20 w-12 h-12 risk-dot-critical" />
              )}

              <div
                className={cn(
                  "rounded-full bg-foreground flex items-center justify-center text-background text-[8px] font-bold cursor-default",
                  riskSize[site.riskLevel],
                  riskOpacity[site.riskLevel]
                )}
              >
                {site.workerCount}
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-popover border rounded-md p-2 shadow-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="font-medium">{site.siteName}</p>
                <p className="text-muted-foreground">{site.workerCount} workers · Avg score: {site.avgScore}</p>
                <p className="text-muted-foreground">Risk: {site.riskLevel}</p>
              </div>
            </div>
          ))}

          {/* Legend */}
          <div className="absolute bottom-2 right-2 flex gap-2">
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).map((level) => (
              <div key={level} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <div className={cn("rounded-full bg-foreground w-2 h-2", riskOpacity[level])} />
                {level}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}