'ENDOFFILE'
import type { MLAnalysis, VisionAnalysis } from "../models/healthRecord.model";
import type { Worker } from "../models/worker.model";

interface RecommendationRule {
  condition: (params: {
    ml: MLAnalysis;
    vision: VisionAnalysis;
    worker: Worker;
    shiftType: string;
  }) => boolean;
  message: string;
  priority: number;
}

const rules: RecommendationRule[] = [
  // Critical PPE
  {
    condition: ({ vision }) => !vision.face.hasHelmet,
    message: "Immediately put on your hard hat before entering the work zone.",
    priority: 1,
  },
  {
    condition: ({ vision }) => !vision.face.hasMask,
    message: "Wear your respirator / face mask — dust and particulate levels require full PPE.",
    priority: 1,
  },

  // Fatigue
  {
    condition: ({ vision }) => vision.face.fatigueScore > 0.7,
    message: "High fatigue detected. Take a 15-minute break and inform your supervisor before continuing.",
    priority: 2,
  },
  {
    condition: ({ vision }) => vision.face.fatigueScore > 0.5,
    message: "Signs of fatigue detected. Schedule a short rest break within the next hour.",
    priority: 3,
  },

  // Environment
  {
    condition: ({ vision }) => vision.environment.dustLevel === "EXTREME",
    message: "Extreme dust levels present. Evacuate area immediately and report to safety officer.",
    priority: 1,
  },
  {
    condition: ({ vision }) => vision.environment.dustLevel === "HIGH",
    message: "Elevated dust levels detected. Ensure full respiratory protection is worn.",
    priority: 2,
  },
  {
    condition: ({ vision }) => vision.environment.lightingLevel === "LOW",
    message: "Poor lighting conditions. Use a headlamp or request additional lighting equipment.",
    priority: 2,
  },
  {
    condition: ({ vision }) => vision.environment.detectedHazards.includes("fire"),
    message: "Fire or flame detected in environment. Activate fire alarm and evacuate immediately.",
    priority: 1,
  },
  {
    condition: ({ vision }) => vision.environment.detectedHazards.includes("wet_floor"),
    message: "Wet floor hazard detected. Walk carefully and use anti-slip footwear.",
    priority: 2,
  },
  {
    condition: ({ vision }) => vision.environment.detectedHazards.includes("chemical_spill"),
    message: "Potential chemical spill detected. Do not touch — alert hazmat team immediately.",
    priority: 1,
  },

  // Shift-based
  {
    condition: ({ shiftType }) => shiftType === "night",
    message: "Night shift: Stay hydrated and take scheduled breaks to maintain alertness.",
    priority: 4,
  },

  // Score-based general advice
  {
    condition: ({ ml }) => ml.healthScore < 40,
    message: "Critical health risk score. Do not operate heavy machinery — contact your supervisor now.",
    priority: 1,
  },
  {
    condition: ({ ml }) => ml.healthScore >= 40 && ml.healthScore < 60,
    message: "Elevated risk detected. Limit exposure to hazardous areas until risk factors are addressed.",
    priority: 2,
  },
  {
    condition: ({ ml }) => ml.healthScore >= 60 && ml.healthScore < 80,
    message: "Moderate risk level. Follow standard safety protocols and monitor your condition.",
    priority: 3,
  },

  // Chronic conditions
  {
    condition: ({ worker }) => worker.healthProfile.conditions.includes("asthma"),
    message: "Asthma alert: Elevated dust levels may trigger symptoms. Keep inhaler accessible.",
    priority: 2,
  },
  {
    condition: ({ worker }) => worker.healthProfile.conditions.includes("hypertension"),
    message: "Hypertension alert: Monitor blood pressure if working in high-stress conditions.",
    priority: 3,
  },
  {
    condition: ({ worker }) => worker.healthProfile.conditions.includes("heart_condition"),
    message: "Cardiac alert: Avoid heavy lifting and extreme temperatures. Alert supervisor if chest discomfort occurs.",
    priority: 2,
  },

  // Positive reinforcement
  {
    condition: ({ ml, vision }) =>
      ml.healthScore >= 80 && vision.face.hasHelmet && vision.face.hasMask,
    message: "Excellent PPE compliance and health indicators. Keep up the great safety habits!",
    priority: 5,
  },
];

/**
 * Generates a prioritized list of safety recommendations for a check-in.
 * Returns up to 5 recommendations, highest priority first.
 */
export function generateRecommendations(params: {
  ml: MLAnalysis;
  vision: VisionAnalysis;
  worker: Worker;
  shiftType: string;
  maxCount?: number;
}): string[] {
  const { maxCount = 5 } = params;

  const matched = rules
    .filter((rule) => rule.condition(params))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxCount);

  return matched.map((r) => r.message);
}