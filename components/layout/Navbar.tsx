"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Bell, LogOut, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const workerLinks = [
  { href: ROUTES.WORKER_CHECKIN, label: "Check In" },
  { href: ROUTES.WORKER_DASHBOARD, label: "Dashboard" },
  { href: ROUTES.WORKER_HISTORY, label: "History" },
];

interface NavbarProps {
  role?: "worker" | "admin";
  workerName?: string;
  unreadAlerts?: number;
}

export function Navbar({ role = "worker", workerName, unreadAlerts = 0 }: NavbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = role === "worker" ? workerLinks : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-semibold tracking-tight">SafeGuard AI</span>
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
        <div className="flex items-center gap-2">
          {/* Alerts */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href={role === "admin" ? ROUTES.ADMIN_ALERTS : ROUTES.WORKER_DASHBOARD}>
              <Bell className="h-4 w-4" />
              {unreadAlerts > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {unreadAlerts > 9 ? "9+" : unreadAlerts}
                </Badge>
              )}
            </Link>
          </Button>

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Worker name */}
          {workerName && (
            <span className="hidden md:block text-sm text-muted-foreground">
              {workerName}
            </span>
          )}

          {/* Logout */}
          <Button variant="ghost" size="icon">
            <LogOut className="h-4 w-4" />
          </Button>

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

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t">
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