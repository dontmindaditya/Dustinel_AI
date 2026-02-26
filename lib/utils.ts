import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RiskLevel } from "@/types/worker";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRiskLevelLabel(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    LOW: "Low Risk",
    MEDIUM: "Medium Risk",
    HIGH: "High Risk",
    CRITICAL: "Critical",
  };
  return map[level];
}

export function getRiskLevelVariant(
  level: RiskLevel
): "default" | "secondary" | "outline" | "destructive" {
  const map: Record<RiskLevel, "default" | "secondary" | "outline" | "destructive"> = {
    LOW: "outline",
    MEDIUM: "secondary",
    HIGH: "default",
    CRITICAL: "destructive",
  };
  return map[level];
}

export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 80) return "LOW";
  if (score >= 60) return "MEDIUM";
  if (score >= 40) return "HIGH";
  return "CRITICAL";
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatScore(score: number): string {
  return Math.round(score).toString();
}

export function getRiskDotClass(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    LOW: "bg-foreground/40",
    MEDIUM: "bg-foreground/60",
    HIGH: "bg-foreground/80",
    CRITICAL: "bg-foreground risk-dot-critical",
  };
  return map[level];
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + "...";
}