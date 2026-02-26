"use client";

import { ShieldCheck, ChevronRight, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SafetyRecommendationsProps {
  recommendations: string[];
  loading?: boolean;
  className?: string;
}

export function SafetyRecommendations({
  recommendations,
  loading = false,
  className,
}: SafetyRecommendationsProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!recommendations.length) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Safety Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No active recommendations. Stay safe!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          Safety Recommendations
          <span className="ml-auto text-xs text-muted-foreground font-normal">
            {recommendations.length} item{recommendations.length !== 1 ? "s" : ""}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {recommendations.map((rec, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 p-2.5 rounded-md bg-secondary/50 text-sm"
            >
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 opacity-60" />
              <span className="flex-1">{rec}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}