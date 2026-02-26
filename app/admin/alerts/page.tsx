"use client";

import { useState, useEffect } from "react";
import { Filter, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  cn, formatDateTime, getRiskLevelLabel, getRiskLevelVariant
} from "@/lib/utils";
import type { Alert } from "@/types/api";
import type { RiskLevel } from "@/types/worker";

const demoAlerts: Alert[] = Array.from({ length: 20 }, (_, i) => ({
  id: `a${i}`,
  organizationId: "org1",
  workerId: `w${(i % 5) + 1}`,
  workerName: ["Rajesh Kumar", "Amit Singh", "Priya Sharma", "Suresh Nair", "Deepa Menon"][i % 5],
  checkinId: `c${i}`,
  timestamp: new Date(Date.now() - i * 45 * 60000).toISOString(),
  severity: (["CRITICAL", "HIGH", "HIGH", "MEDIUM", "MEDIUM", "LOW", "LOW", "LOW", "HIGH", "CRITICAL"][i % 10]) as RiskLevel,
  type: "HEALTH_RISK",
  message: [
    "No mask detected in high-dust environment. Immediate action required.",
    "High fatigue score detected. Rest recommended before continuing work.",
    "No helmet detected in drilling area.",
    "Elevated dust exposure above permitted levels.",
    "Worker health score below medium threshold.",
  ][i % 5],
  riskFactors: [["NO_MASK", "DUST_HIGH"], ["FATIGUE_HIGH"], ["NO_HELMET"], ["DUST_EXTREME"], ["PPE_MISSING"]][i % 5],
  status: i % 3 === 0 ? "RESOLVED" : "OPEN",
  resolvedBy: i % 3 === 0 ? "admin_001" : null,
  resolvedAt: i % 3 === 0 ? new Date(Date.now() - i * 30 * 60000).toISOString() : null,
  notificationsSent: i < 5 ? ["push", "sms"] : ["push"],
  site: ["Mine Site A", "Mine Site B", "Mine Site C"][i % 3],
}));

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  useEffect(() => {
    const t = setTimeout(() => {
      setAlerts(demoAlerts);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const handleResolve = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => a.id === id ? { ...a, status: "RESOLVED" as const } : a)
    );
  };

  const openAlerts = alerts.filter((a) => a.status === "OPEN");
  const resolvedAlerts = alerts.filter((a) => a.status === "RESOLVED");

  const filterAlerts = (list: Alert[]) => {
    if (severityFilter === "all") return list;
    return list.filter((a) => a.severity === severityFilter);
  };

  const AlertRow = ({ alert }: { alert: Alert }) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant={getRiskLevelVariant(alert.severity)} className="text-[10px] h-4 px-1.5">
                {alert.severity}
              </Badge>
              <span className="text-sm font-medium">{alert.workerName}</span>
              {alert.status === "RESOLVED" && (
                <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                  Resolved
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>

            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span>{formatDateTime(alert.timestamp)}</span>
              <span>·</span>
              <span>{alert.site}</span>
              <span>·</span>
              <span>Sent via: {alert.notificationsSent.join(", ")}</span>
            </div>

            {alert.riskFactors.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {alert.riskFactors.map((f) => (
                  <span
                    key={f}
                    className="text-[10px] bg-secondary px-1.5 py-0.5 rounded"
                  >
                    {f.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}
          </div>

          {alert.status === "OPEN" && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-7 text-xs px-2"
              onClick={() => handleResolve(alert.id)}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Resolve
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {openAlerts.length} open · {resolvedAlerts.length} resolved
          </p>
        </div>

        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="CRITICAL">Critical</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">
              Open ({filterAlerts(openAlerts).length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({filterAlerts(resolvedAlerts).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="mt-4 space-y-3">
            {filterAlerts(openAlerts).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No open alerts</p>
              </div>
            ) : (
              filterAlerts(openAlerts).map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-4 space-y-3">
            {filterAlerts(resolvedAlerts).map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}