"use client";

import React, { useState, useEffect } from "react";
import { Users, AlertTriangle, TrendingUp, Activity, ChevronRight, Search } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import type { RiskLevel } from "@/types/worker";

// ─── Leaflet map — fully isolated, loaded client-side only ────────────────────
const LeafletMap = dynamic(() => import("./leafletmap"), {
  ssr: false,
  loading: () => <div className="flex-1 bg-muted animate-pulse" style={{ minHeight: 400 }} />,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Worker = {
  id: string;
  name: string;
  dept: string;
  zone: string;
  risk: RiskLevel;
  health: number;
  lat: number;
  lng: number;
  lastSeen: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const RISK_COLOR: Record<RiskLevel, string> = {
  CRITICAL: "#dc2626",
  HIGH:     "#ea580c",
  MEDIUM:   "#ca8a04",
  LOW:      "#16a34a",
};

const RISK_ORDER: Record<RiskLevel, number> = {
  CRITICAL: 0,
  HIGH:     1,
  MEDIUM:   2,
  LOW:      3,
};

const BASE_LAT = 23.7948;
const BASE_LNG = 86.4304;

const TREND_DATA = [
  { date: "Feb 20", score: 74 },
  { date: "Feb 21", score: 69 },
  { date: "Feb 22", score: 72 },
  { date: "Feb 23", score: 68 },
  { date: "Feb 24", score: 75 },
  { date: "Feb 25", score: 71 },
  { date: "Feb 26", score: 71 },
];

const RISK_DIST_DATA = [
  { level: "LOW"      as RiskLevel, count: 11, percentage: 46 },
  { level: "MEDIUM"   as RiskLevel, count:  8, percentage: 33 },
  { level: "HIGH"     as RiskLevel, count:  3, percentage: 13 },
  { level: "CRITICAL" as RiskLevel, count:  2, percentage:  8 },
];

const FILTER_OPTIONS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
type FilterOption = typeof FILTER_OPTIONS[number];

// ─── Worker factory ───────────────────────────────────────────────────────────

function makeWorkers(n: number): Worker[] {
  const depts = ["Drilling","Blasting","Survey","Transport","Extraction","Ventilation","Safety"];
  const zones = ["Zone A","Zone B","Zone C","Zone D","Zone E"];
  const risks: RiskLevel[] = ["CRITICAL","HIGH","MEDIUM","MEDIUM","LOW","LOW","LOW"];
  const first = ["Rajesh","Amit","Priya","Suresh","Meena","Karan","Divya","Rohit","Sunita","Arjun","Neha","Vikram","Pooja","Ravi","Aisha","Deepak","Sneha","Manish","Kavita","Rahul","Sanjay","Lakshmi","Prakash","Nisha"];
  const last  = ["Kumar","Singh","Sharma","Nair","Patel","Mehta","Verma","Joshi","Gupta","Rao","Shah","Tiwari","Mishra","Iyer","Bose","Kapoor","Pandey","Chauhan","Pillai","Reddy"];
  return Array.from({ length: n }, (_, i): Worker => ({
    id:       `w${i + 1}`,
    name:     `${first[i % first.length]} ${last[i % last.length]}`,
    dept:     depts[i % depts.length],
    zone:     zones[i % zones.length],
    risk:     risks[i % risks.length],
    health:   Math.floor(20 + Math.random() * 75),
    lat:      BASE_LAT + (Math.random() - 0.5) * 0.02,
    lng:      BASE_LNG + (Math.random() - 0.5) * 0.02,
    lastSeen: `${Math.floor(Math.random() * 15) + 1}m ago`,
  }));
}

const INITIAL_WORKERS = makeWorkers(24);

// ─── Main Dashboard ───────────────────────────────────────────────────────────

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState<Worker[]>(INITIAL_WORKERS);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRisk, setFilterRisk] = useState<FilterOption>("ALL");

  // Initial load delay
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Simulate GPS movement every 2s
  useEffect(() => {
    const id = setInterval(() => {
      setWorkers((prev) =>
        prev.map((w) => ({
          ...w,
          lat: Math.max(BASE_LAT - 0.01, Math.min(BASE_LAT + 0.01, w.lat + (Math.random() - 0.5) * 0.001)),
          lng: Math.max(BASE_LNG - 0.01, Math.min(BASE_LNG + 0.01, w.lng + (Math.random() - 0.5) * 0.001)),
        }))
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Filtered + sorted worker list
  const visibleWorkers = workers
    .filter((w) =>
      (filterRisk === "ALL" || w.risk === filterRisk) &&
      (
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.dept.toLowerCase().includes(search.toLowerCase())
      )
    )
    .sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk]);

  // ── Loading skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-52" />)}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">SafeGuard · Admin Console</h1>
          <p className="text-sm text-muted-foreground">dustinel-ai · Mine Operations</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          All systems nominal · {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Workers",  value: 42, sub: "24 on-site now",      Icon: Users },
          { label: "Active Today",   value: 38, sub: "90% check-in rate",   Icon: Activity },
          { label: "Avg Risk Score", value: 71, sub: "org-wide baseline",   Icon: TrendingUp },
          { label: "Alerts Today",   value:  5, sub: "2 open · 3 resolved", Icon: AlertTriangle },
        ].map(({ label, value, sub, Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-3xl font-bold tabular-nums">{value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Trend chart — matches screenshot */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">7-Day Risk Score Trend</CardTitle>
          </CardHeader>
          <CardContent className="pr-2">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={TREND_DATA} margin={{ top: 10, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                />
                <YAxis
                  domain={[50, 90]}
                  ticks={[50, 60, 70, 80, 90]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  width={36}
                />
                <Tooltip
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "3 3" }}
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    fontSize: "12px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#38bdf8", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#7dd3fc", strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={RISK_DIST_DATA.map((d) => ({ name: d.level, value: d.count, color: RISK_COLOR[d.level] }))}
                    dataKey="value"
                    cx="50%" cy="50%"
                    innerRadius={34} outerRadius={56}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {RISK_DIST_DATA.map((d, i) => (
                      <Cell key={i} fill={RISK_COLOR[d.level]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {RISK_DIST_DATA.map((d) => (
                  <div key={d.level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: RISK_COLOR[d.level] }} />
                      <span className="text-xs text-muted-foreground">{d.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{d.percentage}%</span>
                      <span className="text-xs font-semibold tabular-nums w-4 text-right">{d.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Worker Location Tracking ── */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Worker Location Tracking</CardTitle>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <span className="text-xs text-muted-foreground">{workers.length} workers tracked</span>
          </div>
        </CardHeader>

        {/* Mobile: map on top, list below. Desktop: side-by-side */}
        <div className="flex flex-col md:flex-row">

          {/* Map — full width on mobile, flex-1 on desktop */}
          <div className="h-64 sm:h-80 md:h-[520px] md:flex-1 order-1 md:order-2">
            <LeafletMap
              workers={visibleWorkers}
              selected={selected}
              onSelect={(id) => setSelected((prev) => (prev === id ? null : id))}
              baseLat={BASE_LAT}
              baseLng={BASE_LNG}
            />
          </div>

          {/* Sidebar — full width on mobile below map, fixed width on desktop */}
          <div className="w-full md:w-64 shrink-0 border-t md:border-t-0 md:border-r flex flex-col order-2 md:order-1 md:h-[520px]">

            {/* Search + filters */}
            <div className="p-3 border-b space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search workers…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 text-sm md:h-8 md:text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTER_OPTIONS.map((r) => (
                  <Button
                    key={r}
                    variant={filterRisk === r ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilterRisk(r)}
                    className="h-8 text-xs px-3 md:h-6 md:text-[10px] md:px-2 font-medium"
                  >
                    {r === "ALL" ? "All" : r[0] + r.slice(1).toLowerCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Worker list — capped height on mobile so page stays scrollable */}
            <div className="overflow-y-auto max-h-72 md:max-h-none md:flex-1">
              {visibleWorkers.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">No workers match</div>
              ) : (
                visibleWorkers.map((w) => {
                  const active = selected === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => setSelected(active ? null : w.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left
                        border-b border-border/40 last:border-0 transition-colors
                        ${active ? "bg-secondary" : "hover:bg-secondary/50"}
                      `}
                    >
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: RISK_COLOR[w.risk] }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{w.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{w.dept} · {w.zone} · {w.lastSeen}</div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-sm font-bold tabular-nums" style={{ color: RISK_COLOR[w.risk] }}>{w.health}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}