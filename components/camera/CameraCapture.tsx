"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, RefreshCw, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { CAMERA_COUNTDOWN_SECONDS } from "@/lib/constants";
import { useWorkerI18n } from "@/lib/workerI18n";

interface CameraCaptureProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  label?: string;
  hint?: string;
  className?: string;
  autoCapture?: boolean;
}

export function CameraCapture({
  onCapture,
  label,
  hint,
  className,
  autoCapture = false,
}: CameraCaptureProps) {
  const { t } = useWorkerI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<"idle" | "streaming" | "countdown" | "captured" | "error">("idle");
  const [countdown, setCountdown] = useState(CAMERA_COUNTDOWN_SECONDS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const resolvedLabel = label ?? t("camera.face.label");
  const resolvedHint = hint ?? t("camera.face.hint");

  // Declare triggerCountdown first so it can be used in startCamera
  const triggerCountdown = useCallback(() => {
    setState("countdown");
    setCountdown(CAMERA_COUNTDOWN_SECONDS);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onCapture(blob, url);
        stopCamera();
        setState("captured");
      },
      "image/jpeg",
      0.9
    );
  }, [onCapture, stopCamera]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("streaming");
      if (autoCapture) {
        triggerCountdown();
      }
    } catch {
      setErrorMsg(t("camera.face.permissionError"));
      setState("error");
    }
  }, [autoCapture, t, triggerCountdown]);

  useEffect(() => {
    if (state !== "countdown") return;
    if (countdown === 0) {
      capturePhoto();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [state, countdown, capturePhoto]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [stopCamera, previewUrl]);

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setState("idle");
  };

  // Circumference for SVG countdown ring
  const RADIUS = 40;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = ((CAMERA_COUNTDOWN_SECONDS - countdown) / CAMERA_COUNTDOWN_SECONDS) * CIRCUMFERENCE;

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="text-sm font-medium">{resolvedLabel}</div>

      {/* Viewfinder / Preview */}
      <div className="relative w-full max-w-sm aspect-[4/3] rounded-lg overflow-hidden bg-muted border">
        {/* Video stream */}
        <video
          ref={videoRef}
          className={cn(
            "w-full h-full object-cover",
            state === "streaming" || state === "countdown" ? "block" : "hidden"
          )}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Preview after capture */}
        {state === "captured" && previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt={t("camera.capturedAlt")} className="w-full h-full object-cover" />
        )}

        {/* Idle placeholder */}
        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Camera className="h-10 w-10 opacity-30" />
            <p className="text-xs">{resolvedHint}</p>
          </div>
        )}

        {/* Error state */}
        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground p-4">
            <AlertCircle className="h-8 w-8 opacity-50" />
            <p className="text-xs text-center">{errorMsg}</p>
          </div>
        )}

        {/* Camera viewfinder corners (when streaming) */}
        {(state === "streaming" || state === "countdown") && (
          <>
            <div className="camera-corner camera-corner-tl" />
            <div className="camera-corner camera-corner-tr" />
            <div className="camera-corner camera-corner-bl" />
            <div className="camera-corner camera-corner-br" />
          </>
        )}

        {/* Countdown overlay */}
        {state === "countdown" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm">
            <div className="relative flex items-center justify-center">
              <svg width="100" height="100" className="countdown-ring">
                <circle
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="4"
                />
                <circle
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="none"
                  stroke="hsl(var(--foreground))"
                  strokeWidth="4"
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={CIRCUMFERENCE - progress}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.9s linear" }}
                />
              </svg>
              <span className="absolute text-2xl font-bold tabular-nums">{countdown}</span>
            </div>
          </div>
        )}

        {/* Captured success overlay */}
        {state === "captured" && (
          <div className="absolute top-2 right-2">
            <div className="bg-foreground text-background rounded-full p-1">
              <Check className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {state === "idle" && (
          <Button onClick={startCamera} size="sm">
            <Camera className="h-4 w-4" />
            {t("camera.openCamera")}
          </Button>
        )}
        {state === "streaming" && (
          <Button onClick={triggerCountdown} size="sm">
            {t("camera.capture")}
          </Button>
        )}
        {state === "captured" && (
          <Button variant="outline" onClick={retake} size="sm">
            <RefreshCw className="h-4 w-4" />
            {t("camera.retake")}
          </Button>
        )}
        {state === "error" && (
          <Button variant="outline" onClick={startCamera} size="sm">
            {t("camera.tryAgain")}
          </Button>
        )}
      </div>
    </div>
  );
}
