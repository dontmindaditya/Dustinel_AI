"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CameraCapture } from "@/components/camera/CameraCapture";
import { EnvironmentCapture } from "@/components/camera/EnvironmentCapture";
import { RiskScoreGauge } from "@/components/dashboard/RiskScoreGauge";
import { SafetyRecommendations } from "@/components/dashboard/SafetyRecommendations";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { useCheckin } from "@/hooks/useCheckin";
import { formatDateTime } from "@/lib/utils";

const stepLabels: Record<string, string> = {
  idle: "",
  "uploading-face": "Uploading face photo...",
  "uploading-env": "Uploading environment photo...",
  analyzing: "AI analyzing your safety status...",
  complete: "Analysis complete!",
  error: "Something went wrong",
};

const progressValues: Record<string, number> = {
  idle: 0,
  "uploading-face": 25,
  "uploading-env": 50,
  analyzing: 75,
  complete: 100,
  error: 0,
};

export default function CheckinPage() {
  const [faceBlob, setFaceBlob] = useState<Blob | null>(null);
  const [envBlob, setEnvBlob] = useState<Blob | null>(null);
  const { step: checkinStep, result, error, submitCheckin, reset } = useCheckin();

  const canSubmit = faceBlob !== null && envBlob !== null && checkinStep === "idle";
  const isSubmitting = ["uploading-face", "uploading-env", "analyzing"].includes(checkinStep);

  const handleSubmit = async () => {
    if (!faceBlob || !envBlob) return;

    // Get location if available
    let location = { lat: 0, lng: 0 };
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
      );
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}

    await submitCheckin({
      token: "demo-token", // In real app: from session
      workerId: "worker_001",
      faceBlob,
      envBlob,
      location,
      shiftType: "morning",
    });
  };

  if (checkinStep === "complete" && result) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-60" />
          <h1 className="text-xl font-semibold">Check-in Complete</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDateTime(result.timestamp)}
          </p>
        </div>

        {/* Risk gauge */}
        <Card>
          <CardContent className="flex flex-col items-center py-8">
            <RiskScoreGauge
              score={result.healthScore}
              riskLevel={result.riskLevel}
              size="lg"
            />
          </CardContent>
        </Card>

        {/* Alert banner for high/critical */}
        {(result.riskLevel === "HIGH" || result.riskLevel === "CRITICAL") && (
          <AlertBanner
            riskLevel={result.riskLevel}
            message={`Your safety score is ${result.healthScore}. ${result.alertSent ? "Your supervisor has been notified." : ""}`}
          />
        )}

        {/* Recommendations */}
        <SafetyRecommendations recommendations={result.recommendations} />

        {/* Risk factors */}
        {result.riskFactors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Detected Risk Factors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.riskFactors.map((factor, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{factor.type.replace(/_/g, " ")}</span>
                  <span className="text-xs border rounded-full px-2 py-0.5">{factor.severity}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={reset}>
            New Check-in
          </Button>
          <Button className="flex-1" asChild>
            <a href="/worker/dashboard">View Dashboard</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">Daily Safety Check-in</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Capture your face and work environment to get your safety score.
        </p>
      </div>

      {/* Photo captures */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <CameraCapture
            onCapture={(blob) => setFaceBlob(blob)}
            label="Step 1 — Face Photo"
            hint="Look directly at the camera. Make sure your helmet and PPE are visible."
          />

          <Separator />

          <EnvironmentCapture
            onCapture={(blob) => setEnvBlob(blob)}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      {isSubmitting ? (
        <Card>
          <CardContent className="py-6 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {stepLabels[checkinStep]}
            </div>
            <Progress value={progressValues[checkinStep]} />
          </CardContent>
        </Card>
      ) : (
        <Button
          className="w-full"
          size="lg"
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          {canSubmit ? (
            <>
              Submit Check-in
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            "Capture both photos to continue"
          )}
        </Button>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-secondary text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {checkinStep === "error" && (
        <Button variant="outline" className="w-full" onClick={reset}>
          Try Again
        </Button>
      )}
    </div>
  );
}
