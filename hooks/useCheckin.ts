"use client";

import { useState, useCallback } from "react";
import { checkinApi, uploadImageToBlob } from "@/lib/api";
import type { CheckinResponse } from "@/types/api";

type CheckinStep =
  | "idle"
  | "uploading-face"
  | "uploading-env"
  | "analyzing"
  | "complete"
  | "error";

interface UseCheckinReturn {
  step: CheckinStep;
  result: CheckinResponse | null;
  error: string | null;
  progress: number;
  submitCheckin: (params: {
    token: string;
    workerId: string;
    faceBlob: Blob;
    envBlob: Blob;
    location: { lat: number; lng: number };
    shiftType: string;
  }) => Promise<void>;
  reset: () => void;
}

export function useCheckin(): UseCheckinReturn {
  const [step, setStep] = useState<CheckinStep>("idle");
  const [result, setResult] = useState<CheckinResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const submitCheckin = useCallback(
    async ({
      token,
      workerId,
      faceBlob,
      envBlob,
      location,
      shiftType,
    }: {
      token: string;
      workerId: string;
      faceBlob: Blob;
      envBlob: Blob;
      location: { lat: number; lng: number };
      shiftType: string;
    }) => {
      try {
        setStep("uploading-face");
        setProgress(10);
        setError(null);

        // Get SAS URL for face image
        const faceSas = await checkinApi.getSasUrl(token, "face", workerId);
        setProgress(20);
        await uploadImageToBlob(faceSas.sasUrl, faceBlob);
        setProgress(35);

        setStep("uploading-env");
        // Get SAS URL for env image
        const envSas = await checkinApi.getSasUrl(token, "environment", workerId);
        setProgress(45);
        await uploadImageToBlob(envSas.sasUrl, envBlob);
        setProgress(60);

        setStep("analyzing");
        setProgress(70);

        // Submit check-in
        const response = await checkinApi.submitCheckin(token, {
          workerId,
          faceImageUrl: faceSas.blobUrl,
          envImageUrl: envSas.blobUrl,
          location,
          shiftType,
        });
        setProgress(100);
        setResult(response);
        setStep("complete");
      } catch (err: any) {
        setError(
          err?.response?.data?.message || "Check-in failed. Please try again."
        );
        setStep("error");
        setProgress(0);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setStep("idle");
    setResult(null);
    setError(null);
    setProgress(0);
  }, []);

  return { step, result, error, progress, submitCheckin, reset };
}