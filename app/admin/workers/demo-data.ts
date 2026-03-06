import type { HealthRecord } from "@/types/health";
import type { RiskLevel, Worker, WorkerSummary } from "@/types/worker";

export const demoWorkers: WorkerSummary[] = Array.from({ length: 15 }, (_, i) => ({
  workerId: `w${i + 1}`,
  name: [
    "Rajesh Kumar",
    "Amit Singh",
    "Priya Sharma",
    "Suresh Nair",
    "Deepa Menon",
    "Vikram Rao",
    "Sunita Patel",
    "Arjun Das",
    "Meena Iyer",
    "Kiran Joshi",
    "Rohit Verma",
    "Pooja Gupta",
    "Manoj Kumar",
    "Kavitha Reddy",
    "Anil Sharma",
  ][i],
  department: [
    "Drilling",
    "Blasting",
    "Survey",
    "Transport",
    "Safety",
    "Drilling",
    "Maintenance",
    "Transport",
    "Safety",
    "Blasting",
    "Drilling",
    "Survey",
    "Maintenance",
    "Blasting",
    "Safety",
  ][i],
  site: ["Mine Site A", "Mine Site B", "Mine Site C", "Mine Site A", "Mine Site B"][i % 5],
  currentRiskLevel: [
    "CRITICAL",
    "HIGH",
    "MEDIUM",
    "LOW",
    "LOW",
    "MEDIUM",
    "LOW",
    "HIGH",
    "LOW",
    "MEDIUM",
    "LOW",
    "LOW",
    "MEDIUM",
    "HIGH",
    "LOW",
  ][i] as RiskLevel,
  lastCheckin: new Date(Date.now() - i * 2 * 3600000).toISOString(),
  healthScore: [28, 52, 67, 88, 91, 73, 85, 55, 92, 76, 83, 89, 70, 48, 95][i],
}));

export function getDemoWorker(workerId: string): Worker | null {
  const summary = demoWorkers.find((w) => w.workerId === workerId);
  if (!summary) return null;

  const firstName = summary.name.split(" ")[0].toLowerCase();

  return {
    id: summary.workerId,
    workerId: summary.workerId,
    organizationId: "org1",
    name: summary.name,
    email: `${firstName}@minecorp.com`,
    phone: "+91-9876543210",
    role: "worker",
    department: summary.department,
    site: summary.site,
    shift: "morning",
    azureUserId: "",
    deviceTokens: [],
    healthProfile: {
      baselineScore: 85,
      conditions: summary.currentRiskLevel === "CRITICAL" ? ["asthma"] : [],
      lastCheckin: summary.lastCheckin,
      currentRiskLevel: summary.currentRiskLevel,
      streakDaysLowRisk: summary.currentRiskLevel === "LOW" ? 4 : 0,
    },
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: new Date().toISOString(),
  };
}

export function getDemoRecords(workerId: string): HealthRecord[] {
  const summary = demoWorkers.find((w) => w.workerId === workerId);
  const baseScore = summary?.healthScore ?? 75;
  const baseRisk = summary?.currentRiskLevel ?? "MEDIUM";
  const site = summary?.site ?? "Mine Site A";

  return Array.from({ length: 8 }, (_, i) => {
    const score = Math.max(20, baseScore - i * 5);
    const riskLevel: RiskLevel =
      score < 40 ? "CRITICAL" : score < 60 ? "HIGH" : score < 80 ? "MEDIUM" : "LOW";

    return {
      id: `chk_${workerId}_${i}`,
      workerId,
      organizationId: "org1",
      timestamp: new Date(Date.now() - i * 8 * 60 * 60 * 1000).toISOString(),
      shiftType: "morning",
      location: { lat: 28.6, lng: 77.2, site },
      images: { faceUrl: "", envUrl: "" },
      visionAnalysis: {
        face: {
          hasMask: i > 1,
          hasHelmet: true,
          fatigueScore: baseRisk === "CRITICAL" ? 0.8 : 0.3,
          estimatedAge: 34,
          confidence: 0.9,
        },
        environment: {
          dustLevel: score < 60 ? "HIGH" : "LOW",
          lightingLevel: "OK",
          detectedHazards: [],
          safetyEquipmentVisible: true,
        },
      },
      mlAnalysis: {
        healthScore: score,
        riskLevel,
        riskFactors: [{ type: "NO_MASK", severity: "HIGH", weight: 0.35 }],
        modelVersion: "v2.1.0",
      },
      recommendations:
        i < 2
          ? ["Wear N95 mask immediately", "Report to safety officer before entering work zone"]
          : [],
      alertSent: riskLevel === "CRITICAL" || riskLevel === "HIGH",
      alertId: null,
    };
  });
}
