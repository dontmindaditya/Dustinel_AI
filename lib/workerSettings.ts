export type PreferredTheme = "light" | "dark";

export interface WorkerSettings {
  preferredTheme: PreferredTheme;
  notificationsEnabled: boolean;
  emailDigest: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface WorkerAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const WORKER_SETTINGS_KEY = "worker.settings";
export const WORKER_ALERTS_KEY = "worker.mockAlerts";
export const WORKER_ALERTS_EVENT = "worker:alerts-updated";

export const defaultWorkerSettings: WorkerSettings = {
  preferredTheme: "dark",
  notificationsEnabled: true,
  emailDigest: false,
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "06:00",
};

export const defaultMockAlerts: WorkerAlert[] = [
  {
    id: "a1",
    title: "Mask Reminder",
    message: "Safety officer flagged low mask compliance in your zone.",
    time: "2m ago",
    read: false,
  },
  {
    id: "a2",
    title: "Hydration Check",
    message: "Drink water before starting your next drill cycle.",
    time: "18m ago",
    read: false,
  },
  {
    id: "a3",
    title: "Shift Notice",
    message: "Tomorrow check-in window starts at 07:30 AM.",
    time: "1h ago",
    read: true,
  },
];

export function loadWorkerSettings(): WorkerSettings {
  if (typeof window === "undefined") return defaultWorkerSettings;

  const raw = window.localStorage.getItem(WORKER_SETTINGS_KEY);
  if (!raw) return defaultWorkerSettings;

  try {
    return { ...defaultWorkerSettings, ...JSON.parse(raw) };
  } catch {
    return defaultWorkerSettings;
  }
}

export function saveWorkerSettings(settings: WorkerSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORKER_SETTINGS_KEY, JSON.stringify(settings));
}

export function loadWorkerAlerts(): WorkerAlert[] {
  if (typeof window === "undefined") return defaultMockAlerts;

  const raw = window.localStorage.getItem(WORKER_ALERTS_KEY);
  if (!raw) return defaultMockAlerts;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultMockAlerts;
    return parsed;
  } catch {
    return defaultMockAlerts;
  }
}

export function saveWorkerAlerts(alerts: WorkerAlert[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(WORKER_ALERTS_KEY, JSON.stringify(alerts));
  window.dispatchEvent(new Event(WORKER_ALERTS_EVENT));
}
