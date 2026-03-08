"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { WorkerTable } from "@/components/admin/WorkerTable";
import { useAdminI18n } from "@/lib/adminI18n";
import { demoWorkers } from "./demo-data";

export default function WorkersPage() {
  const { t } = useAdminI18n();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t("nav.workers")}</h1>
          <p className="text-sm text-muted-foreground">{t("adminWorkers.registeredCount", { count: demoWorkers.length })}</p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          {t("adminWorkers.addWorker")}
        </Button>
      </div>

      <WorkerTable workers={demoWorkers} loading={loading} />
    </div>
  );
}
