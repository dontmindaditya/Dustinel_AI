"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { HealthRecord } from "@/types/health";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

interface HealthTimelineProps {
  records: HealthRecord[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const score = payload[0].value;
    return (
      <div className="rounded-md border bg-popover p-3 shadow-sm text-sm">
        <p className="text-muted-foreground mb-1">{label}</p>
        <p className="font-semibold">Score: {score}</p>
      </div>
    );
  }
  return null;
};

export function HealthTimeline({ records, loading = false }: HealthTimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!records.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Health Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            No check-in history yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = [...records]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-14) // last 14 check-ins
    .map((r) => ({
      date: format(parseISO(r.timestamp), "MMM d"),
      score: r.mlAnalysis.healthScore,
      riskLevel: r.mlAnalysis.riskLevel,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Health Trend (Last 14 Check-ins)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Reference lines for risk zones */}
            <ReferenceLine y={80} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={60} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={40} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.5} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--foreground))", strokeWidth: 0 }}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 justify-end">
          {[
            { label: "Low (80+)", opacity: "opacity-40" },
            { label: "Medium (60-79)", opacity: "opacity-60" },
            { label: "High (40-59)", opacity: "opacity-80" },
            { label: "Critical (<40)", opacity: "opacity-100" },
          ].map(({ label, opacity }) => (
            <div key={label} className="flex items-center gap-1">
              <div className={`h-2 w-2 rounded-full bg-foreground ${opacity}`} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}