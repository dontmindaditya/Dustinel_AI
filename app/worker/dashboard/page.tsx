"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Camera, TrendingUp, TrendingDown, Minus, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/Badge";
import { RiskScoreGauge } from "@/components/dashboard/RiskScoreGauge";
import { HealthTimeline } from "@/components/dashboard/HealthTimeline";
import { SafetyRecommendations } from "@/components/dashboard/SafetyRecommendations";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { cn, formatRelativeTime, formatDateTime } from "@/lib/utils";
import type { HealthRecord } from "@/types/health";
import { ROUTES } from "@/lib/constants";

// Demo data for UI preview
const demoRecords: HealthRecord[] = Array.from({ length: 8 }, (_, i) => ({
  id: `chk_${i}`,
  workerId: "worker_001",
  organizationId: "org_minecorp",
  timestamp: new Date(Date.now() - i * 8 * 60 * 60 * 1000).toISOString(),
  shiftType: "morning" as const,
  location: { lat: 28.6, lng: 77.2, site: "Mine Site A" },
  images: { faceUrl: "", envUrl: "" },
  visionAnalysis: {
    face: { hasMask: i > 2, hasHelmet: true, fatigueScore: 0.2 + i * 0.05, estimatedAge: 34, confidence: 0.92 },
    environment: { dustLevel: i < 3 ? "HIGH" : "LOW" as any, lightingLevel: "OK" as any, detectedHazards: [], safetyEquipmentVisible: true },
  },
  mlAnalysis: {
    healthScore: 90 - i * 6,
    riskLevel: i < 2 ? "LOW" : i < 5 ? "MEDIUM" : "HIGH" as any,
    riskFactors: [],
    modelVersion: "v2.1.0",
  },
  recommendations: i < 3 ? [] : [
    "Wear N95 mask — dust level elevated",
    "Hydrate every 30 minutes",
  ],
  alertSent: i >= 5,
  alertId: null,
}));

const latestRecord = demoRecords[0];

function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "flat";
}) {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end gap-1.5">
          <span className="text-2xl font-bold tabular-nums">{value}</span>
          {trend && (
            <TrendIcon
              className={cn(
                "h-4 w-4 mb-1",
                trend === "up" ? "opacity-80" : trend === "down" ? "opacity-40" : "opacity-30"
              )}
            />
          )}
        </div>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function WorkerDashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">My Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Last check-in: {formatRelativeTime(latestRecord.timestamp)}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href={ROUTES.WORKER_CHECKIN}>
            <Camera className="h-4 w-4" />
            Check In
          </Link>
        </Button>
      </div>

      {/* Alert for high risk */}
      {(latestRecord.mlAnalysis.riskLevel === "HIGH" || latestRecord.mlAnalysis.riskLevel === "CRITICAL") && (
        <AlertBanner
          riskLevel={latestRecord.mlAnalysis.riskLevel}
          message="Your last check-in detected elevated risk. Please review recommendations below."
          timestamp={formatRelativeTime(latestRecord.timestamp)}
        />
      )}

      {/* Risk gauge */}
      <Card>
        <CardContent className="flex flex-col items-center py-8 gap-4">
          <RiskScoreGauge
            score={latestRecord.mlAnalysis.healthScore}
            riskLevel={latestRecord.mlAnalysis.riskLevel}
            size="lg"
          />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDateTime(latestRecord.timestamp)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {latestRecord.location.site}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="7-Day Avg Score"
          value={Math.round(demoRecords.slice(0, 7).reduce((s, r) => s + r.mlAnalysis.healthScore, 0) / 7)}
          trend="up"
          sub="vs last week"
        />
        <StatCard
          label="Streak (Low Risk)"
          value="3 days"
          trend="up"
          sub="keep it up!"
        />
        <StatCard
          label="Alerts This Week"
          value={demoRecords.filter((r) => r.alertSent).length}
          trend="flat"
          sub="past 7 days"
        />
        <StatCard
          label="Total Check-ins"
          value={demoRecords.length}
          sub="all time"
        />
      </div>

      {/* Health trend chart */}
      <HealthTimeline records={demoRecords} />

      {/* Safety recommendations */}
      <SafetyRecommendations recommendations={latestRecord.recommendations} />
    </div>
  );
}