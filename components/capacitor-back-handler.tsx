"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const ROOT_PATHS = new Set(["/", "/auth/worker/login", "/auth/admin/login", "/worker/dashboard", "/admin/dashboard"]);

export default function CapacitorBackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initBackHandler = async () => {
      try {
        const { App } = await import("@capacitor/app");
        const listener = await App.addListener("backButton", () => {
          const hasWebHistory = window.history.length > 1;
          const isRootRoute = ROOT_PATHS.has(pathname);

          if (hasWebHistory && !isRootRoute) {
            router.back();
          } else {
            App.minimizeApp();
          }
        });

        return listener;
      } catch {
        // Not running in Capacitor, ignore
        return null;
      }
    };

    let removeListener: (() => Promise<void>) | null = null;

    initBackHandler().then((listener) => {
      removeListener = listener?.remove ?? null;
    });

    return () => {
      if (removeListener) {
        void removeListener();
      }
    };
  }, [pathname, router]);

  return null;
}
