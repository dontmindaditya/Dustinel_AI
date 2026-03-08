"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import enMessages from "@/messages/en.json";
import hiMessages from "@/messages/hi.json";
import bnMessages from "@/messages/bn.json";
import teMessages from "@/messages/te.json";
import mrMessages from "@/messages/mr.json";
import taMessages from "@/messages/ta.json";
import { loadWorkerSettings, saveWorkerSettings } from "@/lib/workerSettings";
import type { RiskLevel } from "@/types/worker";

export type WorkerLanguage = "en" | "hi" | "bn" | "te" | "mr" | "ta";

type TranslationDict = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NestedMessages = Record<string, any>;

const LOCALE_BY_LANGUAGE: Record<WorkerLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  te: "te-IN",
  mr: "mr-IN",
  ta: "ta-IN",
};

export const workerLanguageOptions: { value: WorkerLanguage; label: string }[] = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "bn", label: "Bengali" },
  { value: "te", label: "Telugu" },
  { value: "mr", label: "Marathi" },
  { value: "ta", label: "Tamil" },
];

function flattenMessages(
  input: NestedMessages,
  prefix = "",
  output: TranslationDict = {}
): TranslationDict {
  for (const [key, value] of Object.entries(input)) {
    const nextKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      output[nextKey] = value;
    } else {
      flattenMessages(value, nextKey, output);
    }
  }

  return output;
}

const TRANSLATIONS: Record<WorkerLanguage, TranslationDict> = {
  en: flattenMessages(enMessages as NestedMessages),
  hi: flattenMessages(hiMessages as NestedMessages),
  bn: flattenMessages(bnMessages as NestedMessages),
  te: flattenMessages(teMessages as NestedMessages),
  mr: flattenMessages(mrMessages as NestedMessages),
  ta: flattenMessages(taMessages as NestedMessages),
};

const EN_TRANSLATIONS = TRANSLATIONS.en;

function applyTemplate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ""));
}

function getPreferredLanguage(): WorkerLanguage {
  if (typeof window === "undefined") return "en";

  const saved = loadWorkerSettings().preferredLanguage;
  if (saved) return saved;

  const browserLang = (window.navigator.language || "en").toLowerCase();
  if (browserLang.startsWith("hi")) return "hi";
  if (browserLang.startsWith("bn")) return "bn";
  if (browserLang.startsWith("te")) return "te";
  if (browserLang.startsWith("mr")) return "mr";
  if (browserLang.startsWith("ta")) return "ta";
  return "en";
}

type WorkerI18nContextValue = {
  language: WorkerLanguage;
  locale: string;
  setLanguage: (language: WorkerLanguage) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  formatDateTime: (dateString: string) => string;
  formatRelativeTime: (dateString: string) => string;
  getRiskLevelLabel: (level: RiskLevel) => string;
};

const WorkerI18nContext = createContext<WorkerI18nContextValue>({
  language: "en",
  locale: LOCALE_BY_LANGUAGE.en,
  setLanguage: () => undefined,
  t: (key, vars) => applyTemplate(EN_TRANSLATIONS[key] ?? key, vars),
  formatDateTime: (dateString) =>
    new Date(dateString).toLocaleString(LOCALE_BY_LANGUAGE.en, {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
  formatRelativeTime: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return EN_TRANSLATIONS["common.justNow"];
    if (diffMins < 60) return applyTemplate(EN_TRANSLATIONS["common.minutesAgo"], { count: diffMins });
    if (diffHours < 24) return applyTemplate(EN_TRANSLATIONS["common.hoursAgo"], { count: diffHours });
    if (diffDays < 7) return applyTemplate(EN_TRANSLATIONS["common.daysAgo"], { count: diffDays });
    return new Date(dateString).toLocaleDateString(LOCALE_BY_LANGUAGE.en);
  },
  getRiskLevelLabel: (level) => {
    if (level === "LOW") return EN_TRANSLATIONS["risk.low"];
    if (level === "MEDIUM") return EN_TRANSLATIONS["risk.medium"];
    if (level === "HIGH") return EN_TRANSLATIONS["risk.high"];
    return EN_TRANSLATIONS["risk.critical"];
  },
});

export function WorkerI18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<WorkerLanguage>("en");
  const locale = LOCALE_BY_LANGUAGE[language];

  useEffect(() => {
    setLanguageState(getPreferredLanguage());
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dictionary = TRANSLATIONS[language] ?? EN_TRANSLATIONS;
      const template = dictionary[key] ?? EN_TRANSLATIONS[key] ?? key;
      return applyTemplate(template, vars);
    },
    [language]
  );

  const setLanguage = useCallback((nextLanguage: WorkerLanguage) => {
    setLanguageState(nextLanguage);
    const current = loadWorkerSettings();
    saveWorkerSettings({ ...current, preferredLanguage: nextLanguage });
  }, []);

  const formatDateTime = useCallback(
    (dateString: string) =>
      new Date(dateString).toLocaleString(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale]
  );

  const formatRelativeTime = useCallback(
    (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return t("common.justNow");
      if (diffMins < 60) return t("common.minutesAgo", { count: diffMins });
      if (diffHours < 24) return t("common.hoursAgo", { count: diffHours });
      if (diffDays < 7) return t("common.daysAgo", { count: diffDays });
      return new Date(dateString).toLocaleDateString(locale);
    },
    [locale, t]
  );

  const getRiskLevelLabel = useCallback(
    (level: RiskLevel) => {
      if (level === "LOW") return t("risk.low");
      if (level === "MEDIUM") return t("risk.medium");
      if (level === "HIGH") return t("risk.high");
      return t("risk.critical");
    },
    [t]
  );

  const value = useMemo(
    () => ({
      language,
      locale,
      setLanguage,
      t,
      formatDateTime,
      formatRelativeTime,
      getRiskLevelLabel,
    }),
    [formatDateTime, formatRelativeTime, getRiskLevelLabel, language, locale, setLanguage, t]
  );

  return <WorkerI18nContext.Provider value={value}>{children}</WorkerI18nContext.Provider>;
}

export function useWorkerI18n() {
  return useContext(WorkerI18nContext);
}
