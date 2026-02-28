"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { RiskLevel } from "@/types/worker";

interface RiskDistributionData {
  level: RiskLevel;
  count: number;
  percentage: number;
}

interface RiskDistributionChartProps {
  data: RiskDistributionData[];
  loading?: boolean;
}

// Use different opacities of foreground for b&w theme
const RISK_COLORS: Record<RiskLevel, string> = {
  LOW: "#22c55e",
  MEDIUM: "#eab308",
  HIGH: "#f97316",
  CRITICAL: "#ef4444",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-md border bg-popover p-2.5 shadow-sm text-xs">
        <p className="font-medium">{payload[0].name}</p>
        <p>{payload[0].value} workers ({payload[0].payload.percentage}%)</p>
      </div>
    );
  }
  return null;
};

export function RiskDistributionChart({ data, loading = false }: RiskDistributionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pie">
          <TabsList className="mb-4 grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
            <TabsTrigger value="pie" className="text-xs">Pie</TabsTrigger>
            <TabsTrigger value="bar" className="text-xs">Bar</TabsTrigger>
          </TabsList>

          <TabsContent value="pie">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="h-40 w-full sm:w-[60%]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="count"
                      nameKey="level"
                      strokeWidth={0}
                    >
                      {data.map((entry) => (
                        <Cell key={entry.level} fill={RISK_COLORS[entry.level]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full space-y-2 flex-1">
                {data.map((entry) => (
                  <div key={entry.level} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: RISK_COLORS[entry.level] }}
                      />
                      <span className="text-muted-foreground">{entry.level}</span>
                    </div>
                    <span className="font-medium tabular-nums">{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="bar">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="level"
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {data.map((entry) => (
                    <Cell key={entry.level} fill={RISK_COLORS[entry.level]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
