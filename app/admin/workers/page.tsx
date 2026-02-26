"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WorkerTable } from "@/components/admin/WorkerTable";
import type { WorkerSummary } from "@/types/worker";

const demoWorkers: WorkerSummary[] = Array.from({ length: 15 }, (_, i) => ({
  workerId: `w${i + 1}`,
  name: ["Rajesh Kumar", "Amit Singh", "Priya Sharma", "Suresh Nair", "Deepa Menon",
    "Vikram Rao", "Sunita Patel", "Arjun Das", "Meena Iyer", "Kiran Joshi",
    "Rohit Verma", "Pooja Gupta", "Manoj Kumar", "Kavitha Reddy", "Anil Sharma"][i],
  department: ["Drilling", "Blasting", "Survey", "Transport", "Safety",
    "Drilling", "Maintenance", "Transport", "Safety", "Blasting",
    "Drilling", "Survey", "Maintenance", "Blasting", "Safety"][i],
  site: ["Mine Site A", "Mine Site B", "Mine Site C", "Mine Site A", "Mine Site B"][i % 5],
  currentRiskLevel: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "LOW",
    "MEDIUM", "LOW", "HIGH", "LOW", "MEDIUM",
    "LOW", "LOW", "MEDIUM", "HIGH", "LOW"][i] as any,
  lastCheckin: new Date(Date.now() - i * 2 * 3600000).toISOString(),
  healthScore: [28, 52, 67, 88, 91, 73, 85, 55, 92, 76, 83, 89, 70, 48, 95][i],
}));

export default function WorkersPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Workers</h1>
          <p className="text-sm text-muted-foreground">{demoWorkers.length} registered workers</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Add Worker
        </Button>
      </div>

      <WorkerTable workers={demoWorkers} loading={loading} />
    </div>
  );
}