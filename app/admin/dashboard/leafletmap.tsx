"use client";

// This file is intentionally isolated so it can be dynamic-imported with ssr:false.
// Never import this file directly — always use the dynamic() wrapper in the parent.

import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Badge } from "@/components/ui/Badge";
import type { RiskLevel } from "@/types/worker";

type Worker = {
  id: string;
  name: string;
  dept: string;
  zone: string;
  risk: RiskLevel;
  health: number;
  lat: number;
  lng: number;
  lastSeen: string;
};

const RISK_COLOR: Record<RiskLevel, string> = {
  CRITICAL: "#dc2626",
  HIGH:     "#ea580c",
  MEDIUM:   "#ca8a04",
  LOW:      "#16a34a",
};

interface LeafletMapProps {
  workers:        Worker[];
  selected:       string | null;
  onSelect:       (id: string) => void;
  baseLat:        number;
  baseLng:        number;
}

function createMarkerIcon(risk: RiskLevel, isSelected: boolean) {
  const color = RISK_COLOR[risk];
  const size  = isSelected ? 30 : 22;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${isSelected ? "3px solid #fff" : "2px solid #fff"};
      border-radius:50%;
      box-shadow:${isSelected
        ? "0 0 0 3px rgba(255,255,255,0.3),0 4px 12px rgba(0,0,0,0.5)"
        : "0 2px 6px rgba(0,0,0,0.35)"};
      ${isSelected ? "animation:wpin 1.5s infinite;" : ""}
    "></div>`,
    iconSize:   [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export default function LeafletMap({ workers, selected, onSelect, baseLat, baseLng }: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Pan to selected worker
  useEffect(() => {
    if (!selected || !mapRef.current) return;
    const w = workers.find((w) => w.id === selected);
    if (w) mapRef.current.setView([w.lat, w.lng], 18, { animate: true });
  }, [selected, workers]);

  const selectedWorker = workers.find((w) => w.id === selected);

  if (!isMounted) {
    return (
      <div className="flex-1 relative z-0 bg-muted animate-pulse" style={{ minHeight: 400 }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-muted-foreground">Loading map...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 relative z-0" style={{ minHeight: 400 }}>
      <style>{`
        @keyframes wpin {
          0%   { box-shadow: 0 0 0 0    rgba(220,38,38,0.6); }
          70%  { box-shadow: 0 0 0 10px rgba(220,38,38,0);   }
          100% { box-shadow: 0 0 0 0    rgba(220,38,38,0);   }
        }
      `}</style>

      <MapContainer
        ref={mapRef}
        center={[baseLat, baseLng]}
        zoom={16}
        style={{ height: "100%", width: "100%", minHeight: 400 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {workers.map((w) => (
          <Marker
            key={w.id}
            position={[w.lat, w.lng]}
            icon={createMarkerIcon(w.risk, w.id === selected)}
            eventHandlers={{ click: () => onSelect(w.id) }}
          >
            <Popup>
              <div className="text-sm space-y-1 min-w-[140px]">
                <div className="font-semibold">{w.name}</div>
                <div className="text-xs text-muted-foreground">{w.dept} · {w.zone}</div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-semibold" style={{ color: RISK_COLOR[w.risk] }}>{w.risk}</span>
                  <span className="text-xs text-muted-foreground">Score: {w.health}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* LIVE badge */}
      <span className="absolute top-2 right-2 z-[1000] text-[9px] font-bold tracking-widest text-green-500 bg-green-950/80 border border-green-800 rounded px-1.5 py-0.5">
        LIVE
      </span>

      {/* Selected worker card */}
      {selectedWorker && (
        <div className="absolute top-2 left-2 z-[1000] bg-card border border-border rounded-md p-3 shadow-xl w-[190px]">
          <div className="text-sm font-semibold leading-tight">{selectedWorker.name}</div>
          <div className="text-xs text-muted-foreground mt-0.5 mb-2">{selectedWorker.dept} · {selectedWorker.zone}</div>
          <div className="flex items-center justify-between mb-1.5">
            <Badge
              variant={
                selectedWorker.risk === "LOW"    ? "default"   :
                selectedWorker.risk === "MEDIUM" ? "secondary" : "destructive"
              }
              className="text-[10px] h-5"
            >
              {selectedWorker.risk}
            </Badge>
            <span className="text-xs font-semibold">Score {selectedWorker.health}</span>
          </div>
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${selectedWorker.health}%`, backgroundColor: RISK_COLOR[selectedWorker.risk] }}
            />
          </div>
          <div className="mt-2 text-[9px] text-muted-foreground font-mono">
            {selectedWorker.lat.toFixed(4)}°N {selectedWorker.lng.toFixed(4)}°E · {selectedWorker.lastSeen}
          </div>
        </div>
      )}
    </div>
  );
}