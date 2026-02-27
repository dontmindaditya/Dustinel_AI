import axios from "axios";
import { visionConfig } from "../config/azure.config";
import { logger } from "../utils/logger";
import type { VisionFaceAnalysis, VisionEnvAnalysis } from "../models/healthRecord.model";

const VISION_API_BASE = `${visionConfig.endpoint}/vision/v3.2`;
const PROVIDER = visionConfig.provider;

interface AzureVisionResponse {
  objects?: { object: string; confidence: number; rectangle?: unknown }[];
  tags?: { name: string; confidence: number }[];
  faces?: { age: number; faceRectangle: unknown }[];
  description?: { tags: string[]; captions: { text: string; confidence: number }[] };
}

interface ResearchPrediction {
  label: string;
  score: number;
}

export interface ModelDebugResult {
  provider: string;
  ppe: {
    configured: boolean;
    endpoint?: string;
    predictions: ResearchPrediction[];
    error?: string;
  };
  dust: {
    configured: boolean;
    endpoint?: string;
    predictions: ResearchPrediction[];
    error?: string;
  };
}

const azureVisionHeaders = {
  "Ocp-Apim-Subscription-Key": visionConfig.key,
  "Content-Type": "application/json",
};

const LABELS = {
  helmet: ["hard hat", "helmet", "safety helmet", "construction helmet", "hardhat"],
  mask: ["mask", "face mask", "respirator", "n95", "medical mask"],
  dustExtreme: ["heavy dust", "thick dust", "dust storm", "smoke", "extreme dust"],
  dustHigh: ["dust", "dusty", "haze", "hazy", "pm2.5", "particulate"],
  dustLow: ["dirty", "particles", "debris", "light dust"],
  lightingLow: ["dark", "dim", "poorly lit", "shadows", "night"],
  lightingGood: ["bright", "well lit", "sunlight", "clear"],
  dustHeuristic: ["dust", "smoke", "haze", "fog", "particulate", "dirty", "cloudy_indoor"],
};

function hasAnyKeyword(input: string, keywords: string[]): boolean {
  const value = input.toLowerCase();
  return keywords.some((k) => value.includes(k));
}

function labelsContainAny(labels: string[], keywords: string[]): boolean {
  return labels.some((l) => hasAnyKeyword(l, keywords));
}

function scoreForKeywords(predictions: ResearchPrediction[], keywords: string[]): number {
  const matched = predictions
    .filter((p) => hasAnyKeyword(p.label, keywords))
    .map((p) => p.score);
  return matched.length ? Math.max(...matched) : 0;
}

function parsePredictions(payload: unknown): ResearchPrediction[] {
  const root = payload as any;
  const candidate =
    root?.predictions ??
    root?.output?.predictions ??
    root?.result?.predictions ??
    (Array.isArray(root) ? root : null) ??
    [];

  if (!Array.isArray(candidate)) return [];

  return candidate
    .map((item: any) => {
      const label = item?.label ?? item?.tagName ?? item?.class ?? item?.name ?? "";
      const rawScore = item?.score ?? item?.probability ?? item?.confidence ?? 0;
      const score = typeof rawScore === "number" ? rawScore : Number(rawScore);
      return { label: String(label).toLowerCase(), score: Number.isFinite(score) ? score : 0 };
    })
    .filter((p) => p.label.length > 0);
}

async function callResearchModel(
  endpoint: string,
  apiKey: string | undefined,
  imageUrl: string
): Promise<ResearchPrediction[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await axios.post(endpoint, { url: imageUrl }, { headers, timeout: 10000 });
    return parsePredictions(response.data);
  } catch {
    const response = await axios.post(
      endpoint,
      {
        input_data: {
          columns: ["image_url"],
          data: [[imageUrl]],
        },
      },
      { headers, timeout: 10000 }
    );
    return parsePredictions(response.data);
  }
}

function escalateDustLevel(level: VisionEnvAnalysis["dustLevel"]): VisionEnvAnalysis["dustLevel"] {
  if (level === "NONE") return "LOW";
  if (level === "LOW") return "HIGH";
  if (level === "HIGH") return "EXTREME";
  return "EXTREME";
}

export async function getModelDebugPredictions(params: {
  faceImageUrl?: string;
  envImageUrl?: string;
}): Promise<ModelDebugResult> {
  const { faceImageUrl, envImageUrl } = params;

  const result: ModelDebugResult = {
    provider: PROVIDER,
    ppe: {
      configured: Boolean(visionConfig.ppeModelEndpoint),
      endpoint: visionConfig.ppeModelEndpoint,
      predictions: [],
    },
    dust: {
      configured: Boolean(visionConfig.dustModelEndpoint),
      endpoint: visionConfig.dustModelEndpoint,
      predictions: [],
    },
  };

  if (visionConfig.ppeModelEndpoint && faceImageUrl) {
    try {
      result.ppe.predictions = await callResearchModel(
        visionConfig.ppeModelEndpoint,
        visionConfig.ppeModelApiKey,
        faceImageUrl
      );
    } catch (err: any) {
      result.ppe.error = err?.message ?? "Unknown PPE model error";
    }
  } else if (!faceImageUrl) {
    result.ppe.error = "faceImageUrl not provided";
  }

  if (visionConfig.dustModelEndpoint && envImageUrl) {
    try {
      result.dust.predictions = await callResearchModel(
        visionConfig.dustModelEndpoint,
        visionConfig.dustModelApiKey,
        envImageUrl
      );
    } catch (err: any) {
      result.dust.error = err?.message ?? "Unknown dust model error";
    }
  } else if (!envImageUrl) {
    result.dust.error = "envImageUrl not provided";
  }

  return result;
}

/**
 * PPE extraction using Azure Vision objects/tags.
 * SH17 is a dataset paper (not a callable endpoint), so this remains a reliable fallback path.
 */
async function analyzeFaceWithAzureVision(imageUrl: string): Promise<VisionFaceAnalysis> {
  const response = await axios.post<AzureVisionResponse>(
    `${VISION_API_BASE}/analyze`,
    { url: imageUrl },
    {
      headers: azureVisionHeaders,
      params: { visualFeatures: "Objects,Tags,Faces,Description", language: "en" },
      timeout: 10000,
    }
  );

  const data = response.data;
  const objects = data.objects ?? [];
  const tags = data.tags ?? [];
  const faces = data.faces ?? [];
  const labels = [
    ...objects.map((o) => o.object.toLowerCase()),
    ...tags.map((t) => t.name.toLowerCase()),
  ];

  const hasHelmet = labelsContainAny(labels, LABELS.helmet);
  const hasMask = labelsContainAny(labels, LABELS.mask);
  const estimatedAge = faces.length > 0 ? faces[0].age : 30;

  // Keep as weak raw signal only; final fatigue is computed in ml.service.ts.
  const fatigueKeywords = ["tired", "sleepy", "fatigue", "eyes closed", "drowsy"];
  const descriptionText = [
    ...(data.description?.captions?.map((c) => c.text.toLowerCase()) ?? []),
    ...(data.description?.tags?.map((t) => t.toLowerCase()) ?? []),
  ];
  const fatigueHits = fatigueKeywords.filter((k) => descriptionText.some((d) => d.includes(k))).length;
  const fatigueScore = Math.min(1, fatigueHits * 0.25);
  const confidence = objects.length > 0 ? Math.max(...objects.map((o) => o.confidence)) : 0.75;

  return {
    hasMask,
    hasHelmet,
    fatigueScore,
    estimatedAge,
    confidence,
    modelSource: "azure_vision",
  };
}

/**
 * Dust/clutter heuristics inspired by the dust-visibility paper:
 * low scene clarity can correlate with particulate/obscured imagery.
 * Reference: ScienceDirect S2666165923001278.
 */
async function analyzeEnvironmentWithAzureVision(imageUrl: string): Promise<VisionEnvAnalysis> {
  const response = await axios.post<AzureVisionResponse>(
    `${VISION_API_BASE}/analyze`,
    { url: imageUrl },
    {
      headers: azureVisionHeaders,
      params: { visualFeatures: "Objects,Tags,Description", language: "en" },
      timeout: 10000,
    }
  );

  const data = response.data;
  const captions = data.description?.captions ?? [];
  const topCaption = captions[0];
  const imageClarity = topCaption ? Math.max(0, Math.min(1, topCaption.confidence)) : 0.5;

  const allLabels = [
    ...(data.tags?.map((t) => t.name.toLowerCase()) ?? []),
    ...(data.objects?.map((o) => o.object.toLowerCase()) ?? []),
    ...(captions.map((c) => c.text.toLowerCase()) ?? []),
  ];

  let dustLevel: VisionEnvAnalysis["dustLevel"] = "NONE";
  if (labelsContainAny(allLabels, LABELS.dustExtreme)) dustLevel = "EXTREME";
  else if (labelsContainAny(allLabels, LABELS.dustHigh)) dustLevel = "HIGH";
  else if (labelsContainAny(allLabels, LABELS.dustLow)) dustLevel = "LOW";

  // ScienceDirect-inspired clarity heuristic:
  // unclear "clear scene" + dust-like tags -> dust present.
  const clearSceneClaim =
    topCaption &&
    topCaption.confidence < 0.4 &&
    hasAnyKeyword(topCaption.text, ["clear", "clean", "indoor", "workspace", "site"]);
  if (clearSceneClaim && labelsContainAny(allLabels, LABELS.dustHeuristic) && dustLevel === "NONE") {
    dustLevel = "LOW";
  }

  // Very low caption confidence often indicates obscured scene (dust/smoke/fog).
  if (imageClarity < 0.2) dustLevel = escalateDustLevel(dustLevel);

  let lightingLevel: VisionEnvAnalysis["lightingLevel"] = "OK";
  if (labelsContainAny(allLabels, LABELS.lightingLow)) lightingLevel = "LOW";
  else if (labelsContainAny(allLabels, LABELS.lightingGood)) lightingLevel = "GOOD";

  const hazardKeywords: Record<string, string> = {
    fire: "fire",
    flame: "fire",
    smoke: "smoke",
    flood: "flood",
    "wet floor": "wet_floor",
    water: "wet_floor",
    debris: "debris",
    rubble: "debris",
    chemical: "chemical_spill",
    spill: "chemical_spill",
  };

  const detectedHazards: string[] = [];
  for (const [keyword, hazardId] of Object.entries(hazardKeywords)) {
    if (allLabels.some((l) => l.includes(keyword)) && !detectedHazards.includes(hazardId)) {
      detectedHazards.push(hazardId);
    }
  }

  const safetyEquipmentVisible = allLabels.some((l) =>
    ["safety sign", "fire extinguisher", "first aid", "warning sign", "cone"].some((k) =>
      l.includes(k)
    )
  );

  return {
    dustLevel,
    lightingLevel,
    detectedHazards,
    safetyEquipmentVisible,
    imageClarity,
    modelSource: "azure_vision",
  };
}

function hazardsFromPredictions(predictions: ResearchPrediction[]): string[] {
  const mapping: Record<string, string> = {
    fire: "fire",
    flame: "fire",
    smoke: "smoke",
    flood: "flood",
    "wet floor": "wet_floor",
    water: "wet_floor",
    debris: "debris",
    rubble: "debris",
    chemical: "chemical_spill",
    spill: "chemical_spill",
  };

  const hazards = new Set<string>();
  for (const p of predictions) {
    for (const [keyword, hazardId] of Object.entries(mapping)) {
      if (p.score >= 0.4 && p.label.includes(keyword)) hazards.add(hazardId);
    }
  }
  return Array.from(hazards);
}

function dustLevelFromPredictions(predictions: ResearchPrediction[]): VisionEnvAnalysis["dustLevel"] {
  if (scoreForKeywords(predictions, LABELS.dustExtreme) >= 0.4) return "EXTREME";
  if (scoreForKeywords(predictions, LABELS.dustHigh) >= 0.4) return "HIGH";
  if (scoreForKeywords(predictions, LABELS.dustLow) >= 0.4) return "LOW";
  return "NONE";
}

function lightingFromPredictions(
  predictions: ResearchPrediction[]
): VisionEnvAnalysis["lightingLevel"] {
  if (scoreForKeywords(predictions, LABELS.lightingLow) >= 0.4) return "LOW";
  if (scoreForKeywords(predictions, LABELS.lightingGood) >= 0.4) return "GOOD";
  return "OK";
}

/**
 * SH17 note:
 * SH17 is a dataset paper, not an inference API.
 * If research_only is requested without a configured research PPE endpoint,
 * automatically fall back to Azure Vision instead of returning empty output.
 */
export async function analyzeFaceImage(imageUrl: string): Promise<VisionFaceAnalysis> {
  const researchOnlyRequested = PROVIDER === "research_only";
  const ppeEndpointConfigured = Boolean(visionConfig.ppeModelEndpoint);
  const useAzureVision =
    PROVIDER === "azure_vision" || PROVIDER === "hybrid" || (researchOnlyRequested && !ppeEndpointConfigured);
  const useResearchModel =
    (PROVIDER === "research_only" || PROVIDER === "hybrid") && ppeEndpointConfigured;

  if (researchOnlyRequested && !ppeEndpointConfigured) {
    logger.warn("Research PPE endpoint not configured, falling back to Azure Vision");
  }

  let base: VisionFaceAnalysis = {
    hasMask: false,
    hasHelmet: false,
    fatigueScore: 0.5,
    estimatedAge: 30,
    confidence: 0.6,
    modelSource: "azure_vision",
  };

  if (useAzureVision) {
    try {
      base = await analyzeFaceWithAzureVision(imageUrl);
    } catch (err: any) {
      logger.error("Azure AI Vision face analysis failed", { error: err.message, imageUrl });
    }
  }

  if (useResearchModel && visionConfig.ppeModelEndpoint) {
    try {
      const predictions = await callResearchModel(
        visionConfig.ppeModelEndpoint,
        visionConfig.ppeModelApiKey,
        imageUrl
      );

      const helmetScore = scoreForKeywords(predictions, LABELS.helmet);
      const maskScore = scoreForKeywords(predictions, LABELS.mask);
      const researchHasHelmet = helmetScore >= 0.5;
      const researchHasMask = maskScore >= 0.5;

      return {
        ...base,
        hasHelmet: PROVIDER === "research_only" ? researchHasHelmet : base.hasHelmet || researchHasHelmet,
        hasMask: PROVIDER === "research_only" ? researchHasMask : base.hasMask || researchHasMask,
        confidence: Math.max(base.confidence, helmetScore, maskScore),
        modelSource:
          PROVIDER === "research_only" || researchHasHelmet || researchHasMask
            ? "research_model"
            : "azure_vision",
      };
    } catch (err: any) {
      logger.warn("Research PPE model failed, using base vision result", {
        error: err.message,
        imageUrl,
      });
    }
  }

  return base;
}

export async function analyzeEnvironmentImage(imageUrl: string): Promise<VisionEnvAnalysis> {
  const researchOnlyRequested = PROVIDER === "research_only";
  const dustEndpointConfigured = Boolean(visionConfig.dustModelEndpoint);
  const useAzureVision =
    PROVIDER === "azure_vision" || PROVIDER === "hybrid" || (researchOnlyRequested && !dustEndpointConfigured);
  const useResearchModel =
    (PROVIDER === "research_only" || PROVIDER === "hybrid") && dustEndpointConfigured;

  let base: VisionEnvAnalysis = {
    dustLevel: "LOW",
    lightingLevel: "OK",
    detectedHazards: [],
    safetyEquipmentVisible: false,
    imageClarity: 0.5,
    modelSource: "azure_vision",
  };

  if (useAzureVision) {
    try {
      base = await analyzeEnvironmentWithAzureVision(imageUrl);
    } catch (err: any) {
      logger.error("Azure AI Vision environment analysis failed", {
        error: err.message,
        imageUrl,
      });
    }
  }

  if (useResearchModel && visionConfig.dustModelEndpoint) {
    try {
      const predictions = await callResearchModel(
        visionConfig.dustModelEndpoint,
        visionConfig.dustModelApiKey,
        imageUrl
      );

      const dustLevel = dustLevelFromPredictions(predictions);
      const lightingLevel = lightingFromPredictions(predictions);
      const hazards = hazardsFromPredictions(predictions);
      const safetyEquipmentVisible = predictions.some(
        (p) =>
          p.score >= 0.4 &&
          ["safety sign", "fire extinguisher", "first aid", "warning sign", "cone"].some((k) =>
            p.label.includes(k)
          )
      );

      return {
        dustLevel:
          PROVIDER === "research_only" ? dustLevel : dustLevel === "NONE" ? base.dustLevel : dustLevel,
        lightingLevel:
          PROVIDER === "research_only"
            ? lightingLevel
            : lightingLevel === "OK"
            ? base.lightingLevel
            : lightingLevel,
        detectedHazards: Array.from(new Set([...base.detectedHazards, ...hazards])),
        safetyEquipmentVisible: base.safetyEquipmentVisible || safetyEquipmentVisible,
        imageClarity: base.imageClarity,
        modelSource: "research_model",
      };
    } catch (err: any) {
      logger.warn("Research dust model failed, using base vision result", {
        error: err.message,
        imageUrl,
      });
    }
  }

  return base;
}
