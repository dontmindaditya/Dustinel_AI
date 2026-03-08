"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cn,
  formatRelativeTime,
  getRiskLevelLabel,
  getRiskLevelVariant,
  getRiskDotClass,
} from "@/lib/utils";
import type { WorkerSummary } from "@/types/worker";
import { ROUTES } from "@/lib/constants";

interface WorkerTableProps {
  workers: WorkerSummary[];
  loading?: boolean;
}

export function WorkerTable({ workers, loading = false }: WorkerTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const openWorker = (workerId: string) => {
    router.push(`${ROUTES.ADMIN_WORKERS}/${workerId}`);
  };

  const filtered = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.department.toLowerCase().includes(search.toLowerCase()) ||
      w.site.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search workers, departments, sites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No workers found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((worker) => (
            <div
              key={worker.workerId}
              className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer bg-card"
              onClick={() => openWorker(worker.workerId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openWorker(worker.workerId);
                }
              }}
              role="link"
              tabIndex={0}
              aria-label={`Open ${worker.name} details`}
            >
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 bg-muted">
                  {worker.profilePicture ? (
                    <img
                      src={worker.profilePicture}
                      alt={worker.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-medium">
                      {worker.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{worker.name}</p>
                  <p className="text-xs text-muted-foreground">{worker.department}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {worker.currentRiskLevel ? (
                    <div className="flex items-center gap-1.5">
                      <div className={cn("h-2 w-2 rounded-full", getRiskDotClass(worker.currentRiskLevel))} />
                      <Badge
                        variant={getRiskLevelVariant(worker.currentRiskLevel)}
                        className="text-[10px] h-5 px-1.5"
                      >
                        {getRiskLevelLabel(worker.currentRiskLevel)}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">No data</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {worker.lastCheckin ? formatRelativeTime(worker.lastCheckin) : "Never"}
                </span>
              </div>
              
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{worker.site}</span>
                <span className="text-sm font-medium">
                  Score: {worker.healthScore !== null ? Math.round(worker.healthScore) : "—"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {workers.length} workers
      </p>
    </div>
  );
}
