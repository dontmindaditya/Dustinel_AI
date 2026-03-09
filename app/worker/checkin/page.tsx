"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowRight, CheckCircle2, AlertTriangle, Loader2, Video, StopCircle, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { RiskScoreGauge } from "@/components/dashboard/RiskScoreGauge";
import { SafetyRecommendations } from "@/components/dashboard/SafetyRecommendations";
import { AlertBanner } from "@/components/dashboard/AlertBanner";
import { useCheckin } from "@/hooks/useCheckin";
import { useWorkerI18n } from "@/lib/workerI18n";
import { ROUTES } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

type VideoState = "idle" | "requesting" | "ready" | "recording" | "recorded" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const SELF_VIDEO_DURATION  = 5;   // seconds — face + PPE scan
const ENV_VIDEO_DURATION   = 15;  // seconds — 360° pan

const progressValues: Record<string, number> = {
  idle:             0,
  "uploading-face": 25,
  "uploading-env":  50,
  analyzing:        75,
  complete:         100,
  error:            0,
};

// ─── SelfVideoCapture ─────────────────────────────────────────────────────────
// Records a 5-second front-camera video of the worker.

function SelfVideoCapture({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const videoRef                      = useRef<HTMLVideoElement>(null);
  const recorderRef                   = useRef<MediaRecorder | null>(null);
  const chunksRef                     = useRef<BlobPart[]>([]);
  const timerRef                      = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef                     = useRef<MediaStream | null>(null);

  const [state,      setState]        = useState<VideoState>("idle");
  const [countdown,  setCountdown]    = useState(SELF_VIDEO_DURATION);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [errorMsg,   setErrorMsg]     = useState("");

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async () => {
    setState("requesting");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setState("ready");
    } catch {
      setErrorMsg("Camera access denied. Please allow camera permissions.");
      setState("error");
    }
  };

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setCountdown(SELF_VIDEO_DURATION);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url  = URL.createObjectURL(blob);
      setPreviewUrl(url);
      onCapture(blob);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setState("recorded");
    };

    recorder.start(100);
    setState("recording");

    let remaining = SELF_VIDEO_DURATION;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        recorder.stop();
      }
    }, 1000);
  }, [onCapture]);

  const retake = () => {
    setPreviewUrl(null);
    setCountdown(SELF_VIDEO_DURATION);
    setState("idle");
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const progressPct = ((SELF_VIDEO_DURATION - countdown) / SELF_VIDEO_DURATION) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Step 1 — Face & PPE Video</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record a {SELF_VIDEO_DURATION}-second front-facing video. Ensure your face and PPE are clearly visible.
          </p>
        </div>
        {state === "recorded" && (
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        )}
      </div>

      {/* Preview or live feed */}
      <div className="relative w-full aspect-[3/4] max-h-72 bg-muted rounded-lg overflow-hidden">
        {state === "recorded" && previewUrl ? (
          <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover scale-x-[-1]"
            playsInline
            muted
          />
        )}

        {/* Recording countdown overlay */}
        {state === "recording" && (
          <div className="absolute inset-0 flex flex-col items-center justify-end p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="w-full space-y-1.5">
              <div className="flex justify-between text-xs text-white/80">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Recording
                </span>
                <span>{countdown}s remaining</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>
          </div>
        )}

        {/* Idle placeholder */}
        {(state === "idle" || state === "requesting") && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
      </div>

      {/* Controls */}
      {state === "idle" && (
        <Button variant="outline" className="w-full" onClick={startCamera}>
          <Video className="h-4 w-4 mr-2" /> Open Front Camera
        </Button>
      )}
      {state === "requesting" && (
        <Button variant="outline" className="w-full" disabled>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Requesting camera…
        </Button>
      )}
      {state === "ready" && (
        <Button className="w-full" onClick={startRecording}>
          <StopCircle className="h-4 w-4 mr-2" /> Start {SELF_VIDEO_DURATION}s Recording
        </Button>
      )}
      {state === "recording" && (
        <Button variant="outline" className="w-full" disabled>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Recording — {countdown}s left
        </Button>
      )}
      {state === "recorded" && (
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={retake}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake
        </Button>
      )}
      {state === "error" && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">{errorMsg}</p>
          <Button variant="outline" className="w-full" onClick={startCamera}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── EnvVideoCapture ──────────────────────────────────────────────────────────
// Records a 15-second rear-camera video — worker pans 360° around the site.

function EnvVideoCapture({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const videoRef                      = useRef<HTMLVideoElement>(null);
  const recorderRef                   = useRef<MediaRecorder | null>(null);
  const chunksRef                     = useRef<BlobPart[]>([]);
  const timerRef                      = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef                     = useRef<MediaStream | null>(null);

  const [state,      setState]        = useState<VideoState>("idle");
  const [countdown,  setCountdown]    = useState(ENV_VIDEO_DURATION);
  const [previewUrl, setPreviewUrl]   = useState<string | null>(null);
  const [errorMsg,   setErrorMsg]     = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCamera = async () => {
    setState("requesting");
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Try rear camera first for environment scan
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setState("ready");
    } catch {
      setErrorMsg("Camera access denied. Please allow camera permissions.");
      setState("error");
    }
  };

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setCountdown(ENV_VIDEO_DURATION);

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url  = URL.createObjectURL(blob);
      setPreviewUrl(url);
      onCapture(blob);
      streamRef.current?.getTracks().forEach(t => t.stop());
      setState("recorded");
    };

    recorder.start(100);
    setState("recording");

    let remaining = ENV_VIDEO_DURATION;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        recorder.stop();
      }
    }, 1000);
  }, [onCapture]);

  const retake = () => {
    setPreviewUrl(null);
    setCountdown(ENV_VIDEO_DURATION);
    setState("idle");
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const progressPct = ((ENV_VIDEO_DURATION - countdown) / ENV_VIDEO_DURATION) * 100;

  // Rotation guide segments (4 × 90°)
  const segments = ["Front", "Right", "Back", "Left"];
  const currentSegment = Math.min(
    Math.floor(((ENV_VIDEO_DURATION - countdown) / ENV_VIDEO_DURATION) * 4),
    3
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Step 2 — 360° Environment Video</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record a {ENV_VIDEO_DURATION}-second video panning your camera fully around the worksite.
          </p>
        </div>
        {state === "recorded" && (
          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
        )}
      </div>

      {/* Preview or live feed */}
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
        {state === "recorded" && previewUrl ? (
          <video src={previewUrl} className="w-full h-full object-cover" controls playsInline />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
        )}

        {/* 360° guidance overlay during recording */}
        {state === "recording" && (
          <div className="absolute inset-0 flex flex-col justify-between p-3 bg-gradient-to-t from-black/60 to-transparent">
            {/* Direction indicator */}
            <div className="flex justify-center gap-2">
              {segments.map((seg, i) => (
                <span
                  key={seg}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all ${
                    i === currentSegment
                      ? "bg-amber-500 text-black"
                      : i < currentSegment
                      ? "bg-white/20 text-white/50 line-through"
                      : "bg-white/10 text-white/40"
                  }`}
                >
                  {seg}
                </span>
              ))}
            </div>

            {/* Progress */}
            <div className="w-full space-y-1.5">
              <div className="flex justify-between text-xs text-white/80">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Scanning environment
                </span>
                <span>{countdown}s remaining</span>
              </div>
              <Progress value={progressPct} className="h-1.5" />
            </div>
          </div>
        )}

        {/* Idle placeholder */}
        {(state === "idle" || state === "requesting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground/60">360° environment scan</p>
          </div>
        )}
      </div>

      {/* Direction guide when ready */}
      {state === "ready" && (
        <div className="flex justify-between px-1">
          {segments.map(seg => (
            <span key={seg} className="text-[10px] text-muted-foreground text-center flex-1">
              {seg}
            </span>
          ))}
        </div>
      )}

      {/* Controls */}
      {state === "idle" && (
        <Button variant="outline" className="w-full" onClick={startCamera}>
          <Video className="h-4 w-4 mr-2" /> Open Rear Camera
        </Button>
      )}
      {state === "requesting" && (
        <Button variant="outline" className="w-full" disabled>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Requesting camera…
        </Button>
      )}
      {state === "ready" && (
        <Button className="w-full" onClick={startRecording}>
          <StopCircle className="h-4 w-4 mr-2" /> Start {ENV_VIDEO_DURATION}s 360° Scan
        </Button>
      )}
      {state === "recording" && (
        <Button variant="outline" className="w-full" disabled>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning — {countdown}s left
        </Button>
      )}
      {state === "recorded" && (
        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={retake}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Retake
        </Button>
      )}
      {state === "error" && (
        <div className="space-y-2">
          <p className="text-xs text-destructive">{errorMsg}</p>
          <Button variant="outline" className="w-full" onClick={startCamera}>
            <RefreshCw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── CheckinPage ──────────────────────────────────────────────────────────────

export default function CheckinPage() {
  const { t, formatDateTime } = useWorkerI18n();
  const [faceBlob, setFaceBlob]   = useState<Blob | null>(null);
  const [envBlob,  setEnvBlob]    = useState<Blob | null>(null);
  const { step: checkinStep, result, error, submitCheckin, reset } = useCheckin();

  const stepLabels: Record<string, string> = {
    idle:             "",
    "uploading-face": t("checkin.uploadingFace"),
    "uploading-env":  t("checkin.uploadingEnv"),
    analyzing:        t("checkin.analyzing"),
    complete:         t("checkin.completeStep"),
    error:            t("checkin.genericError"),
  };

  const canSubmit    = faceBlob !== null && envBlob !== null && checkinStep === "idle";
  const isSubmitting = ["uploading-face", "uploading-env", "analyzing"].includes(checkinStep);

  const handleSubmit = async () => {
    if (!faceBlob || !envBlob) return;

    let location = { lat: 0, lng: 0 };
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 })
      );
      location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {}

    await submitCheckin({
      token:     "demo-token",
      workerId:  "worker_001",
      faceBlob,
      envBlob,
      location,
      shiftType: "morning",
    });
  };

  // ── Complete screen ────────────────────────────────────────────────────────
  if (checkinStep === "complete" && result) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-60" />
          <h1 className="text-xl font-semibold">{t("checkin.completeTitle")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatDateTime(result.timestamp)}
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center py-8">
            <RiskScoreGauge score={result.healthScore} riskLevel={result.riskLevel} size="lg" />
          </CardContent>
        </Card>

        {(result.riskLevel === "HIGH" || result.riskLevel === "CRITICAL") && (
          <AlertBanner
            riskLevel={result.riskLevel}
            message={t("checkin.highRiskMessage", {
              score: result.healthScore,
              notify: result.alertSent ? t("checkin.supervisorNotified") : "",
            })}
          />
        )}

        <SafetyRecommendations recommendations={result.recommendations} />

        {result.riskFactors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">{t("checkin.detectedRiskFactors")}</CardTitle>
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
            {t("checkin.newCheckin")}
          </Button>
          <Button className="flex-1" asChild>
            <a href={ROUTES.WORKER_DASHBOARD}>{t("checkin.viewDashboard")}</a>
          </Button>
        </div>
      </div>
    );
  }

  // ── Capture screen ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold">{t("checkin.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("checkin.subtitle")}</p>
      </div>

      {/* Completion indicators */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Face & PPE Video", done: !!faceBlob,  duration: `${SELF_VIDEO_DURATION}s` },
          { label: "360° Environment", done: !!envBlob,   duration: `${ENV_VIDEO_DURATION}s` },
        ].map(({ label, done, duration }) => (
          <div
            key={label}
            className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors ${
              done ? "border-green-500/30 bg-green-500/5" : "border-border bg-secondary/30"
            }`}
          >
            {done
              ? <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              : <Video className="h-4 w-4 text-muted-foreground shrink-0" />
            }
            <div className="min-w-0">
              <p className={`font-medium truncate ${done ? "text-green-600" : "text-muted-foreground"}`}>{label}</p>
              <p className="text-xs text-muted-foreground">{done ? "Recorded ✓" : `${duration} required`}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Video captures */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          <SelfVideoCapture onCapture={setFaceBlob} />
          <Separator />
          <EnvVideoCapture onCapture={setEnvBlob} />
        </CardContent>
      </Card>

      {/* Submit / progress */}
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
        <Button className="w-full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
          {canSubmit ? (
            <>
              {t("checkin.submit")}
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            t("checkin.captureBoth")
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
          {t("camera.tryAgain")}
        </Button>
      )}
    </div>
  );
}