"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROUTES } from "@/lib/constants";
import {
  WORKER_ALERTS_EVENT,
  defaultMockAlerts,
  loadWorkerSettings,
  saveWorkerAlerts,
  saveWorkerSettings,
  type WorkerSettings,
} from "@/lib/workerSettings";
import { useTheme } from "next-themes";

type WorkerProfile = {
  fullName: string;
  workerId: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  department: string;
  avatarUrl: string;
};

export default function WorkerSettingsPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<WorkerSettings>(() => loadWorkerSettings());
  const [profile, setProfile] = useState<WorkerProfile>({
    fullName: "Rajesh Kumar",
    workerId: "WKR-001",
    email: "rajesh.kumar@minecorp.com",
    phone: "+91 98765 43210",
    emergencyContactName: "Sanjay Kumar",
    emergencyContactPhone: "+91 99887 76655",
    department: "Drilling",
    avatarUrl: "",
  });
  const [saved, setSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    setTheme(settings.preferredTheme);
  }, [settings.preferredTheme, setTheme]);

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

  const handleProfilePhotoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((prev) => ({ ...prev, avatarUrl: String(reader.result ?? "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = () => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 1800);
  };

  const initials = profile.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your worker app preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-2">
              <div className="h-20 w-20 overflow-hidden rounded-full border border-border bg-muted/40">
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt="Worker profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold">
                    {initials || "WK"}
                  </div>
                )}
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  handleProfilePhotoUpload(file);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => photoInputRef.current?.click()}
              >
                Upload Photo
              </Button>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Full Name</p>
                <Input
                  value={profile.fullName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Worker ID / Badge</p>
                <Input value={profile.workerId} readOnly className="opacity-80" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Emergency Contact Name</p>
                <Input
                  value={profile.emergencyContactName}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, emergencyContactName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Emergency Contact Phone</p>
                <Input
                  value={profile.emergencyContactPhone}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Job Role / Department</p>
                <Select
                  value={profile.department}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Drilling">Drilling</SelectItem>
                    <SelectItem value="Blasting">Blasting</SelectItem>
                    <SelectItem value="Survey">Survey</SelectItem>
                    <SelectItem value="Transport">Transport</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Construction">Construction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleProfileSave}>Save Profile</Button>
            <Button variant="link" className="px-1" type="button">
              Change Password
            </Button>
            {profileSaved && (
              <span className="text-sm text-muted-foreground">Profile saved successfully</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Theme</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              variant={settings.preferredTheme === "dark" ? "default" : "outline"}
              onClick={() => setPreferredTheme("dark")}
            >
              Dark
            </Button>
            <Button
              className="w-full sm:w-auto"
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
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Enable notifications</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, notificationsEnabled: e.target.checked }))
              }
            />
          </label>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>Daily email digest (mock)</span>
            <input
              type="checkbox"
              checked={settings.emailDigest}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, emailDigest: e.target.checked }))
              }
            />
          </label>

          <label className="flex items-center justify-between gap-3 text-sm">
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
