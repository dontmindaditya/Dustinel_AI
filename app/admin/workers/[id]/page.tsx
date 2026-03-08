"use client";

import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, Phone, Mail, Clock } from "lucide-react";
import Link from "next/link";
import { useAdminI18n } from "@/lib/adminI18n";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Separator } from "@/components/ui/separator";
import { RiskScoreGauge } from "@/components/dashboard/RiskScoreGauge";
import { HealthTimeline } from "@/components/dashboard/HealthTimeline";
import { SafetyRecommendations } from "@/components/dashboard/SafetyRecommendations";
import { getRiskLevelLabel, getRiskLevelVariant, formatDateTime } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import { getDemoRecords, getDemoWorker } from "../demo-data";

export default function WorkerDetailPage() {
  const { t } = useAdminI18n();
  const params = useParams<{ id: string | string[] }>();
  const workerId = Array.isArray(params.id) ? params.id[0] : params.id;

  const worker = getDemoWorker(workerId);
  const records = getDemoRecords(workerId);
  const latest = records[0];

  if (!worker || !latest) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link href={ROUTES.ADMIN_WORKERS}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to workers
          </Link>
        </Button>
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            {t("adminWorkers.notFound")}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href={ROUTES.ADMIN_WORKERS}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{worker.name}</h1>
            {worker.healthProfile.currentRiskLevel && (
              <Badge variant={getRiskLevelVariant(worker.healthProfile.currentRiskLevel)}>
                {getRiskLevelLabel(worker.healthProfile.currentRiskLevel)}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {worker.department} · {worker.site}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="space-y-4">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t("adminWorkers.workerInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{worker.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                {worker.phone}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {worker.site}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">{t("adminWorkers.shift")}</p>
                  <p className="font-medium capitalize">{worker.shift}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("adminWorkers.baselineScore")}</p>
                  <p className="font-medium">{worker.healthProfile.baselineScore}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("adminWorkers.conditions")}</p>
                  <p className="font-medium capitalize">
                    {worker.healthProfile.conditions.join(", ") || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t("adminWorkers.streakLowRisk")}</p>
                  <p className="font-medium">{worker.healthProfile.streakDaysLowRisk} days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <HealthTimeline records={records} />
          <SafetyRecommendations recommendations={latest.recommendations} />

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t("adminWorkers.recentCheckins")}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {records.slice(0, 5).map((r) => (
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

