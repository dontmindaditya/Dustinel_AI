"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import { RiskScoreGauge } from "@/components/dashboard/RiskScoreGauge";
import { HealthTimeline } from "@/components/dashboard/HealthTimeline";
import { SafetyRecommendations } from "@/components/dashboard/SafetyRecommendations";
import { getRiskLevelLabel, getRiskLevelVariant, formatDateTime } from "@/lib/utils";
import type { HealthRecord } from "@/types/health";
import { ROUTES } from "@/lib/constants";

// Demo worker data
const demoWorker = {
  id: "w1", workerId: "w1", organizationId: "org1",
  name: "Rajesh Kumar", email: "rajesh@minecorp.com", phone: "+91-9876543210",
  role: "worker" as const, department: "Drilling", site: "Mine Site A",
  shift: "morning" as const, azureUserId: "", deviceTokens: [],
  healthProfile: {
    baselineScore: 85, conditions: ["asthma"],
    lastCheckin: new Date(Date.now() - 5 * 60000).toISOString(),
    currentRiskLevel: "CRITICAL" as const, streakDaysLowRisk: 0,
  },
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: new Date().toISOString(),
};

const demoRecords: HealthRecord[] = Array.from({ length: 8 }, (_, i) => ({
  id: `chk_${i}`,
  workerId: "w1",
  organizationId: "org1",
  timestamp: new Date(Date.now() - i * 8 * 60 * 60 * 1000).toISOString(),
  shiftType: "morning" as const,
  location: { lat: 28.6, lng: 77.2, site: "Mine Site A" },
  images: { faceUrl: "", envUrl: "" },
  visionAnalysis: {
    face: { hasMask: i > 1, hasHelmet: true, fatigueScore: 0.3, estimatedAge: 34, confidence: 0.9 },
    environment: { dustLevel: "HIGH" as any, lightingLevel: "OK" as any, detectedHazards: [], safetyEquipmentVisible: true },
  },
  mlAnalysis: {
    healthScore: Math.max(25, 88 - i * 8),
    riskLevel: i === 0 ? "CRITICAL" : i < 3 ? "HIGH" : i < 6 ? "MEDIUM" : "LOW" as any,
    riskFactors: [{ type: "NO_MASK", severity: "HIGH" as any, weight: 0.35 }],
    modelVersion: "v2.1.0",
  },
  recommendations: i < 2 ? ["Wear N95 mask immediately", "Report to safety officer before entering work zone"] : [],
  alertSent: i < 3,
  alertId: null,
}));

export default function WorkerDetailPage() {
  const { id } = useParams();
  const latest = demoRecords[0];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href={ROUTES.ADMIN_WORKERS}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{demoWorker.name}</h1>
            {demoWorker.healthProfile.currentRiskLevel && (
              <Badge variant={getRiskLevelVariant(demoWorker.healthProfile.currentRiskLevel)}>
                {getRiskLevelLabel(demoWorker.healthProfile.currentRiskLevel)}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {demoWorker.department} · {demoWorker.site}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Profile + latest score */}
        <div className="space-y-4">
          {/* Current score */}
          <Card>
            <CardContent className="flex flex-col items-center py-6">
              <RiskScoreGauge
                score={latest.mlAnalysis.healthScore}
                riskLevel={latest.mlAnalysis.riskLevel}
                size="md"
              />
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDateTime(latest.timestamp)}
              </p>
            </CardContent>
          </Card>

          {/* Worker info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Worker Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{demoWorker.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {demoWorker.phone}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {demoWorker.site}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Shift</p>
                  <p className="font-medium capitalize">{demoWorker.shift}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Baseline Score</p>
                  <p className="font-medium">{demoWorker.healthProfile.baselineScore}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Conditions</p>
                  <p className="font-medium capitalize">
                    {demoWorker.healthProfile.conditions.join(", ") || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Streak (Low Risk)</p>
                  <p className="font-medium">{demoWorker.healthProfile.streakDaysLowRisk} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: History + recommendations */}
        <div className="lg:col-span-2 space-y-4">
          <HealthTimeline records={demoRecords} />
          <SafetyRecommendations recommendations={latest.recommendations} />

          {/* Recent check-ins table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Recent Check-ins</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {demoRecords.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                    <span className="tabular-nums font-medium w-8">
                      {Math.round(r.mlAnalysis.healthScore)}
                    </span>
                    <Badge variant={getRiskLevelVariant(r.mlAnalysis.riskLevel)} className="text-[10px] h-4 px-1.5">
                      {r.mlAnalysis.riskLevel}
                    </Badge>
                    <span className="text-muted-foreground text-xs flex-1">
                      {formatDateTime(r.timestamp)}
                    </span>
                    {r.alertSent && (
                      <span className="text-[10px] text-muted-foreground border rounded-full px-1.5 py-0.5">
                        alerted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}