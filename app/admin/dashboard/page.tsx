"use client";

import { useState, useEffect } from "react";
import { Users, AlertTriangle, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { RiskDistributionChart } from "@/components/admin/RiskDistributionChart";
import { AlertFeed } from "@/components/admin/AlertFeed";
import { HeatmapWidget } from "@/components/admin/HeatmapWidget";
import { WorkerCard } from "@/components/dashboard/WorkerCard";
import type { WorkerSummary } from "@/types/worker";
import type { Alert } from "@/types/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// Demo data
const demoStats = {
  totalWorkers: 42,
  activeToday: 38,
  avgRiskScore: 71,
  alertsToday: 5,
  riskDistribution: [
    { level: "LOW" as const, count: 22, percentage: 52 },
    { level: "MEDIUM" as const, count: 12, percentage: 29 },
    { level: "HIGH" as const, count: 6, percentage: 14 },
    { level: "CRITICAL" as const, count: 2, percentage: 5 },
  ],
};

const demoTrend = [
  { date: "Feb 20", avgScore: 74 },
  { date: "Feb 21", avgScore: 69 },
  { date: "Feb 22", avgScore: 72 },
  { date: "Feb 23", avgScore: 68 },
  { date: "Feb 24", avgScore: 75 },
  { date: "Feb 25", avgScore: 71 },
  { date: "Feb 26", avgScore: 71 },
];

const demoAlerts: Alert[] = [
  {
    id: "a1", organizationId: "org1", workerId: "w1", workerName: "Rajesh Kumar",
    checkinId: "c1", timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    severity: "CRITICAL", type: "HEALTH_RISK",
    message: "No mask detected in high-dust environment. Health score: 28",
    riskFactors: ["NO_MASK", "DUST_LEVEL_HIGH"], status: "OPEN",
    resolvedBy: null, resolvedAt: null, notificationsSent: ["push", "sms"], site: "Mine Site A",
  },
  {
    id: "a2", organizationId: "org1", workerId: "w2", workerName: "Amit Singh",
    checkinId: "c2", timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    severity: "HIGH", type: "HEALTH_RISK",
    message: "High fatigue score detected. Rest recommended before continuing work.",
    riskFactors: ["FATIGUE_HIGH"], status: "OPEN",
    resolvedBy: null, resolvedAt: null, notificationsSent: ["push"], site: "Mine Site B",
  },
  {
    id: "a3", organizationId: "org1", workerId: "w3", workerName: "Priya Sharma",
    checkinId: "c3", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    severity: "HIGH", type: "HEALTH_RISK",
    message: "No helmet detected in drilling area.",
    riskFactors: ["NO_HELMET"], status: "RESOLVED",
    resolvedBy: "admin_001", resolvedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
    notificationsSent: ["push"], site: "Mine Site A",
  },
];

const demoWorkers: WorkerSummary[] = [
  { workerId: "w1", name: "Rajesh Kumar", department: "Drilling", site: "Mine Site A", currentRiskLevel: "CRITICAL", lastCheckin: new Date(Date.now() - 5 * 60000).toISOString(), healthScore: 28 },
  { workerId: "w2", name: "Amit Singh", department: "Blasting", site: "Mine Site B", currentRiskLevel: "HIGH", lastCheckin: new Date(Date.now() - 22 * 60000).toISOString(), healthScore: 52 },
  { workerId: "w3", name: "Priya Sharma", department: "Survey", site: "Mine Site A", currentRiskLevel: "MEDIUM", lastCheckin: new Date(Date.now() - 4 * 3600000).toISOString(), healthScore: 67 },
  { workerId: "w4", name: "Suresh Nair", department: "Transport", site: "Mine Site C", currentRiskLevel: "LOW", lastCheckin: new Date(Date.now() - 2 * 3600000).toISOString(), healthScore: 88 },
];

const demoSites = [
  { siteId: "s1", siteName: "Mine Site A", x: 30, y: 35, riskLevel: "CRITICAL" as const, workerCount: 15, avgScore: 58 },
  { siteId: "s2", siteName: "Mine Site B", x: 60, y: 55, riskLevel: "HIGH" as const, workerCount: 12, avgScore: 67 },
  { siteId: "s3", siteName: "Mine Site C", x: 75, y: 25, riskLevel: "LOW" as const, workerCount: 10, avgScore: 82 },
  { siteId: "s4", siteName: "Mine Site D", x: 20, y: 70, riskLevel: "MEDIUM" as const, workerCount: 5, avgScore: 74 },
];

function StatCard({ label, value, sub, Icon }: { label: string; value: string | number; sub?: string; Icon: any }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState(demoAlerts);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  const handleResolve = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "RESOLVED" as const } : a))
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-muted-foreground">Mine Corp Ltd · Today</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Workers" value={demoStats.totalWorkers} sub="registered" Icon={Users} />
        <StatCard label="Active Today" value={demoStats.activeToday} sub={`${Math.round(demoStats.activeToday / demoStats.totalWorkers * 100)}% checked in`} Icon={Activity} />
        <StatCard label="Avg Risk Score" value={demoStats.avgRiskScore} sub="organization-wide" Icon={TrendingUp} />
        <StatCard label="Alerts Today" value={demoStats.alertsToday} sub={`${alerts.filter((a) => a.status === "OPEN").length} open`} Icon={AlertTriangle} />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Risk trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">7-Day Risk Score Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={demoTrend} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis domain={[50, 90]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }}
                />
                <Line type="monotone" dataKey="avgScore" stroke="hsl(var(--foreground))" strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--foreground))" }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk distribution */}
        <RiskDistributionChart data={demoStats.riskDistribution} />
      </div>

      {/* Heatmap + Alert feed */}
      <div className="grid lg:grid-cols-2 gap-4">
        <HeatmapWidget sites={demoSites} />
        <AlertFeed alerts={alerts} onResolve={handleResolve} maxHeight="300px" />
      </div>

      {/* High-risk workers */}
      <div>
        <h2 className="text-sm font-medium mb-3">Workers Needing Attention</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {demoWorkers
            .filter((w) => w.currentRiskLevel === "CRITICAL" || w.currentRiskLevel === "HIGH")
            .map((w) => (
              <WorkerCard key={w.workerId} worker={w} isAdmin />
            ))}
        </div>
      </div>
    </div>
  );
}