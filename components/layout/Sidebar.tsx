"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bell,
  Settings,
  ChevronRight,
  Menu,
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
  {
    label: "Settings",
    href: ROUTES.ADMIN_SETTINGS,
    icon: Settings,
  },
];

interface SidebarProps {
  organizationName?: string;
}

export function Sidebar({ organizationName = "Organization" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex h-screen w-60 flex-col border-r border-border bg-background fixed left-0 top-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-border">
        <Image src="/logo.png" alt="Dustinel AI" width={20} height={20} className="h-5 w-5 shrink-0 object-contain" />
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">Dustinel AI</p>
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

    </aside>
  );
}

// Mobile sidebar toggle menu for admin on small screens
export function MobileSidebarNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const activeHref =
    adminNavItems.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/")
    )?.href ?? adminNavItems[0].href;

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-label="Open admin navigation menu"
        aria-expanded={open}
        aria-controls="admin-mobile-nav-menu"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open && (
        <div
          id="admin-mobile-nav-menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 rounded-md border border-border bg-popover p-1 shadow-md"
        >
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2 py-2 text-sm transition-colors",
                  active
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
