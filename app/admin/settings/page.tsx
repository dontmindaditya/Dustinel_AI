"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/lib/constants";
import {
  defaultAdminSettings,
  loadAdminSettings,
  saveAdminSettings,
  type AdminSettings,
} from "@/lib/adminSettings";

export default function AdminSettingsPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<AdminSettings>(defaultAdminSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loaded = loadAdminSettings();
    setSettings(loaded);
    setTheme(loaded.preferredTheme);
  }, [setTheme]);

  const setPreferredTheme = (preferredTheme: AdminSettings["preferredTheme"]) => {
    setSettings((prev) => {
      const updated = { ...prev, preferredTheme };
      saveAdminSettings(updated);
      return updated;
    });
    setTheme(preferredTheme);
  };

  const handleSave = () => {
    saveAdminSettings(settings);
    setTheme(settings.preferredTheme);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSignOut = () => {
    router.push(ROUTES.LOGIN);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">Configure dashboard preferences and session controls.</p>
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
          <CardTitle className="text-base">Alerts & Dashboard</CardTitle>
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
            <span>Critical SMS alerts (mock)</span>
            <input
              type="checkbox"
              checked={settings.criticalSmsAlerts}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, criticalSmsAlerts: e.target.checked }))
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

          <div>
            <p className="text-xs text-muted-foreground mb-1">Dashboard auto refresh (seconds)</p>
            <Input
              type="number"
              min={10}
              max={300}
              step={5}
              value={settings.dashboardAutoRefreshSec}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  dashboardAutoRefreshSec: Number(e.target.value || 30),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Session</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button onClick={handleSave}>Save Settings</Button>
          <Button variant="destructive" onClick={handleSignOut}>
            Sign Out
          </Button>
          {saved && <span className="text-sm text-muted-foreground">Saved</span>}
        </CardContent>
      </Card>
    </div>
  );
}
