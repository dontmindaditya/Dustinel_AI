export type AdminPreferredTheme = "light" | "dark";

export interface AdminSettings {
  preferredTheme: AdminPreferredTheme;
  notificationsEnabled: boolean;
  criticalSmsAlerts: boolean;
  emailDigest: boolean;
  dashboardAutoRefreshSec: number;
}

export const ADMIN_SETTINGS_KEY = "admin.settings";

export const defaultAdminSettings: AdminSettings = {
  preferredTheme: "dark",
  notificationsEnabled: true,
  criticalSmsAlerts: true,
  emailDigest: true,
  dashboardAutoRefreshSec: 30,
};

export function loadAdminSettings(): AdminSettings {
  if (typeof window === "undefined") return defaultAdminSettings;
  const raw = window.localStorage.getItem(ADMIN_SETTINGS_KEY);
  if (!raw) return defaultAdminSettings;

  try {
    return { ...defaultAdminSettings, ...JSON.parse(raw) };
  } catch {
    return defaultAdminSettings;
  }
}

export function saveAdminSettings(settings: AdminSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
}
