"use client";

import { useEffect } from "react";

export default function CapacitorBackHandler() {
  useEffect(() => {
    const initBackHandler = async () => {
      try {
        const { App } = await import("@capacitor/app");
        App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            App.minimizeApp();
          }
        });
      } catch {
        // Not running in Capacitor, ignore
      }
    };

    initBackHandler();
  }, []);

  return null;
}