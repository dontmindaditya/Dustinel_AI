"use client";

import { useRef, useState, useCallback } from "react";
import { Building2, RefreshCw, Check, AlertCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { MAX_IMAGE_SIZE_MB, ALLOWED_IMAGE_TYPES } from "@/lib/constants";

interface EnvironmentCaptureProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  className?: string;
}

export function EnvironmentCapture({ onCapture, className }: EnvironmentCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<"idle" | "streaming" | "captured" | "error">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("streaming");
    } catch {
      setErrorMsg("Camera unavailable. Please upload a photo instead.");
      setState("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
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
      0.85
    );
  }, [onCapture, stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMsg("Please upload a JPEG, PNG, or WebP image.");
      setState("error");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setErrorMsg(`Image must be under ${MAX_IMAGE_SIZE_MB}MB.`);
      setState("error");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onCapture(file, url);
    setState("captured");
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    stopCamera();
    setState("idle");
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <div className="text-sm font-medium">Work Environment Photo</div>

      <div className="relative w-full max-w-sm aspect-video rounded-lg overflow-hidden bg-muted border">
        <video
          ref={videoRef}
          className={cn("w-full h-full object-cover", state === "streaming" ? "block" : "hidden")}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {state === "captured" && previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Environment" className="w-full h-full object-cover" />
        )}

        {state === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="h-10 w-10 opacity-30" />
            <p className="text-xs">Capture your work area</p>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-muted-foreground">
            <AlertCircle className="h-8 w-8 opacity-50" />
            <p className="text-xs text-center">{errorMsg}</p>
          </div>
        )}

        {state === "streaming" && (
          <>
            <div className="camera-corner camera-corner-tl" />
            <div className="camera-corner camera-corner-tr" />
            <div className="camera-corner camera-corner-bl" />
            <div className="camera-corner camera-corner-br" />
          </>
        )}

        {state === "captured" && (
          <div className="absolute top-2 right-2">
            <div className="bg-foreground text-background rounded-full p-1">
              <Check className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={handleFileUpload}
      />

      <div className="flex gap-2 flex-wrap justify-center">
        {(state === "idle" || state === "error") && (
          <>
            <Button onClick={startCamera} size="sm">
              <Building2 className="h-4 w-4" />
              Use Camera
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload Photo
            </Button>
          </>
        )}
        {state === "streaming" && (
          <Button onClick={capturePhoto} size="sm">
            Capture
          </Button>
        )}
        {state === "captured" && (
          <Button variant="outline" onClick={retake} size="sm">
            <RefreshCw className="h-4 w-4" />
            Retake
          </Button>
        )}
      </div>
    </div>
  );
}