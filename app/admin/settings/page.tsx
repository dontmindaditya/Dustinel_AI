"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
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
  loadAdminSettings,
  saveAdminSettings,
  type AdminSettings,
} from "@/lib/adminSettings";

type AdminProfile = {
  fullName: string;
  adminId: string;
  email: string;
  phone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  department: string;
  avatarUrl: string;
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [settings, setSettings] = useState<AdminSettings>(() => loadAdminSettings());
  const [profile, setProfile] = useState<AdminProfile>({
    fullName: "Admin User",
    adminId: "ADM-001",
    email: "admin@minecorp.com",
    phone: "+91 90000 11223",
    emergencyContactName: "Operations Desk",
    emergencyContactPhone: "+91 98888 77665",
    department: "Safety",
    avatarUrl: "",
  });
  const [saved, setSaved] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    setTheme(settings.preferredTheme);
  }, [settings.preferredTheme, setTheme]);

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
        <h1 className="text-xl font-semibold">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">Configure dashboard preferences and session controls.</p>
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
                  <img src={profile.avatarUrl} alt="Admin profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold">
                    {initials || "AD"}
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
                <p className="text-xs text-muted-foreground">Admin ID / Badge</p>
                <Input value={profile.adminId} readOnly className="opacity-80" />
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
