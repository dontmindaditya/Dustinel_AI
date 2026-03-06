"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowUpDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
import type { WorkerSummary, RiskLevel } from "@/types/worker";
import { ROUTES } from "@/lib/constants";

interface WorkerTableProps {
  workers: WorkerSummary[];
  loading?: boolean;
}

type SortKey = "name" | "healthScore" | "lastCheckin" | "currentRiskLevel";

const riskOrder: Record<RiskLevel, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function WorkerTable({ workers, loading = false }: WorkerTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("currentRiskLevel");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = workers
    .filter(
      (w) =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.department.toLowerCase().includes(search.toLowerCase()) ||
        w.site.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortKey === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortKey === "healthScore") {
        comparison = (a.healthScore ?? 0) - (b.healthScore ?? 0);
      } else if (sortKey === "lastCheckin") {
        comparison =
          new Date(a.lastCheckin ?? 0).getTime() -
          new Date(b.lastCheckin ?? 0).getTime();
      } else if (sortKey === "currentRiskLevel") {
        comparison =
          (riskOrder[a.currentRiskLevel ?? "LOW"] ?? 99) -
          (riskOrder[b.currentRiskLevel ?? "LOW"] ?? 99);
      }
      return sortDir === "asc" ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search workers, departments, sites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">
                <button
                  className="flex items-center gap-1 hover:text-foreground text-muted-foreground"
                  onClick={() => toggleSort("name")}
                >
                  Worker
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Site</th>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  className="flex items-center gap-1 hover:text-foreground text-muted-foreground"
                  onClick={() => toggleSort("currentRiskLevel")}
                >
                  Risk
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  className="flex items-center gap-1 hover:text-foreground text-muted-foreground"
                  onClick={() => toggleSort("healthScore")}
                >
                  Score
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium">
                <button
                  className="flex items-center gap-1 hover:text-foreground text-muted-foreground"
                  onClick={() => toggleSort("lastCheckin")}
                >
                  Last Check-in
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  No workers found
                </td>
              </tr>
            ) : (
              filtered.map((worker) => (
                <tr key={worker.workerId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{worker.name}</p>
                      <p className="text-xs text-muted-foreground">{worker.department}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{worker.site}</td>
                  <td className="px-4 py-3">
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
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium">
                    {worker.healthScore !== null ? Math.round(worker.healthScore) : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {worker.lastCheckin ? formatRelativeTime(worker.lastCheckin) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                      <Link href={`${ROUTES.ADMIN_WORKERS}/${worker.workerId}`}>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {workers.length} workers
      </p>
    </div>
  );
}