"use client";

import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn, formatRelativeTime, getRiskLevelLabel, getRiskDotClass, getRiskLevelVariant } from "@/lib/utils";
import type { WorkerSummary } from "@/types/worker";
import { ROUTES } from "@/lib/constants";

interface WorkerCardProps {
  worker: WorkerSummary;
  isAdmin?: boolean;
  className?: string;
}

export function WorkerCard({ worker, isAdmin = false, className }: WorkerCardProps) {
  const content = (
    <Card className={cn("transition-colors", isAdmin && "hover:border-foreground/30", className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{worker.name}</p>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{worker.department}</p>
          </div>
          {worker.currentRiskLevel && (
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  getRiskDotClass(worker.currentRiskLevel)
                )}
              />
              <Badge variant={getRiskLevelVariant(worker.currentRiskLevel)} className="text-[10px] h-5 px-1.5">
                {getRiskLevelLabel(worker.currentRiskLevel)}
              </Badge>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {worker.site}
          </span>
          {worker.lastCheckin && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatRelativeTime(worker.lastCheckin)}
            </span>
          )}
          {worker.healthScore !== null && (
            <span className="ml-auto font-medium tabular-nums text-foreground">
              {Math.round(worker.healthScore)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isAdmin) {
    return (
      <Link href={`${ROUTES.ADMIN_WORKERS}/${worker.workerId}`}>{content}</Link>
    );
  }
  return content;
}