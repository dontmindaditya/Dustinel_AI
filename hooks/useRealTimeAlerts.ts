"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Alert } from "@/types/api";

interface UseRealTimeAlertsReturn {
  alerts: Alert[];
  connected: boolean;
  addAlert: (alert: Alert) => void;
  clearAlerts: () => void;
}

export function useRealTimeAlerts(
  token: string | null,
  organizationId: string | null
): UseRealTimeAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!token || !organizationId) return;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/v1";
    const url = `${apiBase}/admin/alerts/stream?organizationId=${organizationId}&token=${token}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.addEventListener("alert", (e) => {
      try {
        const alert: Alert = JSON.parse((e as MessageEvent).data);
        setAlerts((prev) => [alert, ...prev].slice(0, 50));

        // Play alert sound for HIGH/CRITICAL
        if (alert.severity === "HIGH" || alert.severity === "CRITICAL") {
          // Vibrate on mobile if supported
          if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        }
      } catch {}
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Reconnect after 5s
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          setConnected(false);
        }
      }, 5000);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [token, organizationId]);

  const addAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 50));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return { alerts, connected, addAlert, clearAlerts };
}