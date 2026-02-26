"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  BarChart3,
  Shield,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const adminNavItems = [
  {
    label: "Dashboard",
    href: ROUTES.ADMIN_DASHBOARD,
    icon: LayoutDashboard,
  },
  {
    label: "Workers",
    href: ROUTES.ADMIN_WORKERS,
    icon: Users,
  },
  {
    label: "Alerts",
    href: ROUTES.ADMIN_ALERTS,
    icon: Bell,
  },
];

interface SidebarProps {
  organizationName?: string;
}

export function Sidebar({ organizationName = "Organization" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex h-screen w-60 flex-col border-r bg-background fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b">
        <Shield className="h-5 w-5 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">SafeGuard AI</p>
          <p className="text-xs text-muted-foreground truncate">{organizationName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          Overview
        </p>
        {adminNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-2 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
              {active && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t">
        <Link
          href="/admin/settings"
          className="flex items-center gap-3 px-2 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      </div>
    </aside>
  );
}

// Mobile sidebar toggle menu for admin on small screens
export function MobileSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 lg:hidden px-4">
      {adminNavItems.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-secondary text-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}