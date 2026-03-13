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
import { useWorkerI18n, type WorkerLanguage } from "@/lib/workerI18n";

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
  const { t, language, setLanguage } = useWorkerI18n();
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

  const languageOptions: {
    value: WorkerLanguage;
    label: string;
    nativeLabel: string;
    region: string;
  }[] = [
    { value: "en", label: "English", nativeLabel: "English", region: "Worker app" },
    { value: "hi", label: "Hindi", nativeLabel: "हिन्दी", region: "Worker app" },
    { value: "bn", label: "Bengali", nativeLabel: "বাংলা", region: "Worker app" },
    { value: "te", label: "Telugu", nativeLabel: "తెలుగు", region: "Worker app" },
    { value: "mr", label: "Marathi", nativeLabel: "मराठी", region: "Worker app" },
    { value: "ta", label: "Tamil", nativeLabel: "தமிழ்", region: "Worker app" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.profile")}</CardTitle>
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
                {t("settings.uploadPhoto")}
              </Button>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("settings.fullName")}</p>
                <Input
                  value={profile.fullName}
                  onChange={(e) => setProfile((prev) => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("settings.workerId")}</p>
                <Input value={profile.workerId} readOnly className="opacity-80" />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("settings.email")}</p>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("settings.phone")}</p>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("settings.emergencyName")}</p>
                <Input
                  value={profile.emergencyContactName}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, emergencyContactName: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("settings.emergencyPhone")}</p>
                <Input
                  value={profile.emergencyContactPhone}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-muted-foreground">{t("settings.department")}</p>
                <Select
                  value={profile.department}
                  onValueChange={(value) => setProfile((prev) => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("settings.selectDepartment")} />
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
            <Button onClick={handleProfileSave}>{t("settings.saveProfile")}</Button>
            <Button variant="link" className="px-1" type="button">
              {t("settings.changePassword")}
            </Button>
            {profileSaved && (
              <span className="text-sm text-muted-foreground">{t("settings.profileSaved")}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">{t("settings.appearance")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("settings.theme")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="w-full sm:w-auto"
              variant={settings.preferredTheme === "dark" ? "default" : "outline"}
              onClick={() => setPreferredTheme("dark")}
            >
              {t("settings.dark")}
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant={settings.preferredTheme === "light" ? "default" : "outline"}
              onClick={() => setPreferredTheme("light")}
            >
              {t("settings.light")}
            </Button>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">{t("settings.language")}</p>
            <Select
              value={language}
              onValueChange={(value) => {
                const nextLanguage = value as typeof language;
                try {
                  setLanguage(nextLanguage);
                  setSettings((prev) => {
                    const updated = { ...prev, preferredLanguage: nextLanguage };
                    saveWorkerSettings(updated);
                    return updated;
                  });
                } catch (error) {
                  console.error('Failed to save language preference:', error);
                }
              }}
            >
              <SelectTrigger className="h-11 rounded-xl bg-background/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} ({option.nativeLabel})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("settings.notifications")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t("settings.enableNotifications")}</span>
            <input
              type="checkbox"
              checked={settings.notificationsEnabled}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, notificationsEnabled: e.target.checked }))
              }
            />
          </label>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t("settings.dailyDigest")}</span>
            <input
              type="checkbox"
              checked={settings.emailDigest}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, emailDigest: e.target.checked }))
              }
            />
          </label>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span>{t("settings.quietHours")}</span>
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
                <p className="text-xs text-muted-foreground mb-1">{t("settings.start")}</p>
                <Input
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, quietHoursStart: e.target.value }))
                  }
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("settings.end")}</p>
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
          <CardTitle className="text-base">{t("settings.session")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={resetMockAlerts}>
            {t("settings.reloadMockAlerts")}
          </Button>
          <Button variant="destructive" onClick={() => router.push(ROUTES.WORKER_LOGIN)}>
            {t("settings.signOut")}
          </Button>
          <Button onClick={handleSave}>{t("settings.saveSettings")}</Button>
          {saved && <span className="text-sm text-muted-foreground self-center">{t("settings.saved")}</span>}
        </CardContent>
      </Card>
    </div>
  );
}
