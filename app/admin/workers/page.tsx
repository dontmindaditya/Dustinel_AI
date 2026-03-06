"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WorkerTable } from "@/components/admin/WorkerTable";
import { demoWorkers } from "./demo-data";

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
