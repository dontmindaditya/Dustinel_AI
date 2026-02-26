"use client";

import { useState } from "react";
import { ChevronDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, formatDateTime, getRiskLevelLabel, getRiskLevelVariant } from "@/lib/utils";
import type { HealthRecord } from "@/types/health";

// Demo data
const demoRecords: HealthRecord[] = Array.from({ length: 12 }, (_, i) => ({
  id: `chk_${i}`,
  workerId: "worker_001",
  organizationId: "org_minecorp",
  timestamp: new Date(Date.now() - i * 8 * 60 * 60 * 1000).toISOString(),
  shiftType: i % 3 === 0 ? "night" : "morning" as any,
  location: { lat: 28.6, lng: 77.2, site: "Mine Site A" },
  images: { faceUrl: "", envUrl: "" },
  visionAnalysis: {
    face: { hasMask: i > 2, hasHelmet: true, fatigueScore: 0.2, estimatedAge: 34, confidence: 0.9 },
    environment: { dustLevel: "LOW" as any, lightingLevel: "OK" as any, detectedHazards: [], safetyEquipmentVisible: true },
  },
  mlAnalysis: {
    healthScore: Math.max(30, 90 - i * 5),
    riskLevel: i < 3 ? "LOW" : i < 6 ? "MEDIUM" : i < 10 ? "HIGH" : "CRITICAL" as any,
    riskFactors: i < 3 ? [] : [{ type: "NO_MASK", severity: "HIGH" as any, weight: 0.3 }],
    modelVersion: "v2.1.0",
  },
  recommendations: i < 3 ? [] : ["Wear N95 mask", "Report to safety officer"],
  alertSent: i >= 6,
  alertId: null,
}));

export default function WorkerHistoryPage() {
  const [filter, setFilter] = useState<string>("all");
  const [showCount, setShowCount] = useState(6);

  const filtered = demoRecords.filter((r) => {
    if (filter === "all") return true;
    return r.mlAnalysis.riskLevel === filter;
  });

  const visible = filtered.slice(0, showCount);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Health History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{filtered.length} check-ins</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {visible.map((record, i) => (
          <Card key={record.id} className={cn("transition-all")}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Score circle */}
                <div className="flex-shrink-0 w-11 h-11 rounded-full border-2 border-border flex items-center justify-center">
                  <span className="text-sm font-bold tabular-nums">
                    {Math.round(record.mlAnalysis.healthScore)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={getRiskLevelVariant(record.mlAnalysis.riskLevel)}
                      className="text-[10px] h-4 px-1.5"
                    >
                      {getRiskLevelLabel(record.mlAnalysis.riskLevel)}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">
                      {record.shiftType} shift
                    </span>
                    {record.alertSent && (
                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                        Alert sent
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDateTime(record.timestamp)} · {record.location.site}
                  </p>

                  {/* PPE Status */}
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span className={cn(record.visionAnalysis.face.hasMask ? "" : "line-through opacity-50")}>
                      Mask
                    </span>
                    <span className={cn(record.visionAnalysis.face.hasHelmet ? "" : "line-through opacity-50")}>
                      Helmet
                    </span>
                    <span>Dust: {record.visionAnalysis.environment.dustLevel}</span>
                  </div>

                  {/* Recommendations preview */}
                  {record.recommendations.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1.5 italic">
                      {record.recommendations[0]}
                      {record.recommendations.length > 1 && ` +${record.recommendations.length - 1} more`}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load more */}
      {showCount < filtered.length && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowCount((c) => c + 6)}
        >
          <ChevronDown className="h-4 w-4" />
          Load more ({filtered.length - showCount} remaining)
        </Button>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No check-ins found for this filter.
        </div>
      )}
    </div>
  );
}