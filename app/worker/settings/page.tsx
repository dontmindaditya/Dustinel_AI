"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import {
  WORKER_ALERTS_EVENT,
  defaultMockAlerts,
  defaultWorkerSettings,
  loadWorkerSettings,
  saveWorkerAlerts,
  saveWorkerSettings,
  type WorkerSettings,
} from "@/lib/workerSettings";
import { useTheme } from "next-themes";

export default function WorkerSettingsPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<WorkerSettings>(defaultWorkerSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = loadWorkerSettings();
    setSettings(loaded);
    setTheme(loaded.preferredTheme);
  }, []);

  const setPreferredTheme = (preferredTheme: WorkerSettings["preferredTheme"]) => {
    setSettings((prev) => {
      const updated = { ...prev, preferredTheme };
      saveWorkerSettings(updated);
      return updated;
    });
    setTheme(preferredTheme);
  };

  const handleSave = () => {
    saveWorkerSettings(settings);
    setTheme(settings.preferredTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const resetMockAlerts = () => {
    saveWorkerAlerts(defaultMockAlerts);
    window.dispatchEvent(new Event(WORKER_ALERTS_EVENT));
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your worker app preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Theme</p>
          <div className="flex gap-2">
            <Button
              variant={settings.preferredTheme === "dark" ? "default" : "outline"}
              onClick={() => setPreferredTheme("dark")}
            >
              Dark
            </Button>
            <Button
              variant={settings.preferredTheme === "light" ? "default" : "outline"}
              onClick={() => setPreferredTheme("light")}
            >
              Light
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between text-sm">
            <span>Enable notifications</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, notificationsEnabled: e.target.checked }))
              }
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Daily email digest (mock)</span>
            <input
              type="checkbox"
              checked={settings.emailDigest}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, emailDigest: e.target.checked }))
              }
            />
          </label>

          <label className="flex items-center justify-between text-sm">
            <span>Quiet hours</span>
            <input
              type="checkbox"
              checked={settings.quietHoursEnabled}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, quietHoursEnabled: e.target.checked }))
              }
            />
          </label>

          {settings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Start</p>
                <Input
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, quietHoursStart: e.target.value }))
                  }
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">End</p>
                <Input
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, quietHoursEnd: e.target.value }))
                  }
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={resetMockAlerts}>
            Reload Mock Alerts
          </Button>
          <Button variant="destructive" onClick={() => router.push(ROUTES.LOGIN)}>
            Sign Out
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
          {saved && <span className="text-sm text-muted-foreground self-center">Saved</span>}
        </CardContent>
      </Card>
    </div>
  );
}
