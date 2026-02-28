"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Bell, LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";
import {
  WORKER_ALERTS_EVENT,
  WorkerAlert,
  loadWorkerAlerts,
  loadWorkerSettings,
  saveWorkerAlerts,
  saveWorkerSettings,
} from "@/lib/workerSettings";

const workerLinks = [
  { href: ROUTES.WORKER_CHECKIN, label: "Check In" },
  { href: ROUTES.WORKER_DASHBOARD, label: "Dashboard" },
  { href: ROUTES.WORKER_HISTORY, label: "History" },
  { href: ROUTES.WORKER_SETTINGS, label: "Settings" },
];

interface NavbarProps {
  role?: "worker" | "admin";
  workerName?: string;
  unreadAlerts?: number;
}

export function Navbar({ role = "worker", workerName, unreadAlerts = 0 }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [alerts, setAlerts] = useState<WorkerAlert[]>(() => loadWorkerAlerts());
  const alertPanelRef = useRef<HTMLDivElement | null>(null);

  const links = role === "worker" ? workerLinks : [];
  const unreadCount =
    role === "worker"
      ? alerts.filter((a) => !a.read).length
      : unreadAlerts;

  useEffect(() => {
    if (role !== "worker") return;
    const savedSettings = loadWorkerSettings();
    setTheme(savedSettings.preferredTheme);
  }, [role, setTheme]);

  useEffect(() => {
    const syncAlerts = () => setAlerts(loadWorkerAlerts());
    window.addEventListener(WORKER_ALERTS_EVENT, syncAlerts);
    return () => window.removeEventListener(WORKER_ALERTS_EVENT, syncAlerts);
  }, []);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!alertPanelRef.current) return;
      if (!alertPanelRef.current.contains(event.target as Node)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleThemeToggle = () => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);

    if (role === "worker") {
      const current = loadWorkerSettings();
      saveWorkerSettings({ ...current, preferredTheme: nextTheme });
    }
  };

  const markAllAlertsRead = () => {
    const updated = alerts.map((a) => ({ ...a, read: true }));
    setAlerts(updated);
    saveWorkerAlerts(updated);
  };

  const handleSignOut = () => {
    router.push(ROUTES.LOGIN);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Dustinel AI" width={20} height={20} className="h-5 w-5 object-contain" />
          <span className="font-semibold tracking-tight">Dustinel AI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                pathname === link.href
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="relative flex items-center gap-2" ref={alertPanelRef}>
          {/* Alerts */}
          {role === "admin" ? (
            <Button variant="ghost" size="icon" className="relative" asChild>
              <Link href={ROUTES.ADMIN_ALERTS}>
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Link>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setAlertsOpen((prev) => !prev)}
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Badge>
              )}
            </Button>
          )}

          {/* Theme toggle (admin only) */}
          {role === "admin" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          {/* Worker name (admin only) */}
          {role === "admin" && workerName && (
            <span className="hidden md:block text-sm text-muted-foreground">
              {workerName}
            </span>
          )}

          {/* Logout (admin only) */}
          {role === "admin" && (
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {role === "worker" && alertsOpen && (
        <div className="absolute right-2 top-14 z-50 w-[calc(100vw-1rem)] max-w-[360px] rounded-lg border border-border bg-card shadow-lg sm:right-4 sm:w-[320px]">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-medium">Notifications</p>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllAlertsRead}>
              Mark all read
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto p-2 space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={cn(
                  "rounded-md border border-border p-2",
                  !alert.read && "bg-secondary/40"
                )}
              >
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{alert.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border">
          <nav className="container py-3 flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "px-3 py-2 text-sm rounded-md transition-colors",
                  pathname === link.href
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
