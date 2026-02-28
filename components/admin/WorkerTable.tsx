"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  const goToWorkerDetail = (workerId: string) => {
    router.push(`/admin/workers/${workerId}`);
  };

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
                <tr
                  key={worker.workerId}
                  tabIndex={0}
                  role="link"
                  aria-label={`Open details for ${worker.name}`}
                  onClick={() => goToWorkerDetail(worker.workerId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToWorkerDetail(worker.workerId);
                    }
                  }}
                  className="border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium">{worker.name}</span>
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
