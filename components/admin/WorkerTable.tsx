"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatRelativeTime, getRiskLevelLabel, getRiskLevelVariant } from "@/lib/utils";
import type { WorkerSummary } from "@/types/worker";

interface WorkerTableProps {
  workers: WorkerSummary[];
  loading?: boolean;
}

export function WorkerTable({ workers, loading = false }: WorkerTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="space-y-3 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30 text-left">
                <th className="px-4 py-3 font-medium">Worker</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Health Score</th>
                <th className="px-4 py-3 font-medium">Last Check-in</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.workerId} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/workers/${worker.workerId}`}
                      className="font-medium hover:underline"
                    >
                      {worker.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{worker.workerId}</div>
                  </td>
                  <td className="px-4 py-3">{worker.department}</td>
                  <td className="px-4 py-3">{worker.site}</td>
                  <td className="px-4 py-3">
                    {worker.currentRiskLevel ? (
                      <Badge
                        variant={getRiskLevelVariant(worker.currentRiskLevel)}
                        className={cn(worker.currentRiskLevel === "CRITICAL" && "risk-pulse")}
                      >
                        {getRiskLevelLabel(worker.currentRiskLevel)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{worker.healthScore ?? "N/A"}</td>
                  <td className="px-4 py-3">
                    {worker.lastCheckin ? (
                      <span className="text-muted-foreground">
                        {formatRelativeTime(worker.lastCheckin)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Never</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
