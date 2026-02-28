"use client";

import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn, formatRelativeTime, getRiskLevelVariant } from "@/lib/utils";
import type { Alert } from "@/types/api";

interface AlertFeedProps {
  alerts: Alert[];
  loading?: boolean;
  onResolve?: (alertId: string) => void;
  maxHeight?: string;
}

export function AlertFeed({ alerts, loading = false, onResolve, maxHeight = "400px" }: AlertFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Alert Feed
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {alerts.filter((a) => a.status === "OPEN").length} open
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea style={{ maxHeight }}>
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              No active alerts
            </div>
          ) : (
            <div className="divide-y">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-4 transition-colors",
                    alert.status === "RESOLVED" && "opacity-50"
                  )}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant={getRiskLevelVariant(alert.severity)}
                          className="text-[10px] h-4 px-1.5"
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-sm font-medium truncate">{alert.workerName}</span>
                        {alert.status === "RESOLVED" && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                      <div className="flex flex-wrap items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(alert.timestamp)}
                        <span className="mx-1">-</span>
                        {alert.site}
                      </div>
                    </div>
                    {alert.status === "OPEN" && onResolve && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-fit shrink-0 text-xs px-2"
                        onClick={() => onResolve(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
