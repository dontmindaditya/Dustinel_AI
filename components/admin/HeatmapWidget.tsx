"use client";

import { useState } from "react";
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
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(sites[0]?.siteId ?? null);
  const selectedSite = sites.find((site) => site.siteId === selectedSiteId) ?? null;

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
          {sites.map((site) => {
            const isSelected = selectedSiteId === site.siteId;
            const alignLeft = site.x < 20;
            const alignRight = site.x > 80;
            const showBelow = site.y < 22;
            const tooltipPositionClass = cn(
              "absolute z-10 rounded-md border bg-popover p-2 text-xs shadow-md whitespace-nowrap transition-opacity",
              showBelow ? "top-full mt-2" : "bottom-full mb-2",
              alignLeft
                ? "left-0 translate-x-0"
                : alignRight
                  ? "right-0 translate-x-0"
                  : "left-1/2 -translate-x-1/2"
            );

            return (
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

                <button
                  type="button"
                  onClick={() => setSelectedSiteId(site.siteId)}
                  aria-label={`Show details for ${site.siteName}`}
                  className={cn(
                    "rounded-full bg-foreground flex items-center justify-center text-background text-[8px] font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    riskSize[site.riskLevel],
                    riskOpacity[site.riskLevel],
                    isSelected && "ring-2 ring-ring ring-offset-1 ring-offset-background"
                  )}
                >
                  {site.workerCount}
                </button>

                {/* Tooltip */}
                <div
                  className={cn(
                    "hidden md:block",
                    tooltipPositionClass,
                    isSelected ? "opacity-100" : "opacity-0 pointer-events-none group-hover:opacity-100"
                  )}
                >
                  <p className="font-medium">{site.siteName}</p>
                  <p className="text-muted-foreground">{site.workerCount} workers - Avg score: {site.avgScore}</p>
                  <p className="text-muted-foreground">Risk: {site.riskLevel}</p>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="absolute bottom-2 right-2 flex max-w-[70%] flex-wrap justify-end gap-2">
            {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as RiskLevel[]).map((level) => (
              <div key={level} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <div className={cn("rounded-full bg-foreground w-2 h-2", riskOpacity[level])} />
                {level}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile selected-site details */}
        {selectedSite && (
          <div className="mt-3 rounded-md border bg-popover p-3 text-xs md:hidden">
            <p className="font-medium">{selectedSite.siteName}</p>
            <p className="text-muted-foreground">{selectedSite.workerCount} workers - Avg score: {selectedSite.avgScore}</p>
            <p className="text-muted-foreground">Risk: {selectedSite.riskLevel}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
