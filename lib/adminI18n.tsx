"use client";

import { createContext, useContext, useEffect, useState } from "react";
import enMessages from "@/messages/en.json";
import hiMessages from "@/messages/hi.json";
import bnMessages from "@/messages/bn.json";
import teMessages from "@/messages/te.json";
import mrMessages from "@/messages/mr.json";
import taMessages from "@/messages/ta.json";

type TranslationDict = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NestedMessages = Record<string, any>;

export type AdminLanguage = "en" | "hi" | "bn" | "te" | "mr" | "ta";

type AdminI18nContextValue = {
  language: AdminLanguage;
  t: (key: string, vars?: Record<string, string | number>) => string;
  setLanguage: (language: AdminLanguage) => void;
  isLoading: boolean;
};

const AdminI18nContext = createContext<AdminI18nContextValue>({
  language: "en",
  t: (key) => key,
  setLanguage: () => {},
  isLoading: true,
});

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

const TRANSLATIONS: Record<AdminLanguage, TranslationDict> = {
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

const VALID_LANGUAGES = ["en", "hi", "bn", "te", "mr", "ta"] as const;

function getLanguageFromCookie(): AdminLanguage {
  if (typeof document === "undefined") return "en";
  
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "NEXT_LOCALE" && VALID_LANGUAGES.includes(value as AdminLanguage)) {
      return value as AdminLanguage;
    }
  }
  return "en";
}

export function AdminI18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AdminLanguage>("en");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read language from cookie on mount
    const savedLanguage = getLanguageFromCookie();
    setLanguageState(savedLanguage);
    setIsLoading(false);
  }, []);

  const t = (key: string, vars?: Record<string, string | number>): string => {
    const dictionary = TRANSLATIONS[language] ?? EN_TRANSLATIONS;
    const template = dictionary[key] ?? EN_TRANSLATIONS[key] ?? key;
    return applyTemplate(template, vars);
  };

  const setLanguage = (newLanguage: AdminLanguage) => {
    setLanguageState(newLanguage);
    // Persist choice in cookie so it survives hard refreshes
    document.cookie = `NEXT_LOCALE=${newLanguage}; path=/; max-age=31536000; samesite=lax`;
    // React state update above is enough — no router.refresh() needed.
    // Calling router.refresh() would remount AdminI18nProvider and reset
    // language back to "en" before the cookie-read effect can re-apply it,
    // causing other sections to appear untranslated.
  };

  return (
    <AdminI18nContext.Provider value={{ language, t, setLanguage, isLoading }}>
      {children}
    </AdminI18nContext.Provider>
  );
}

export function useAdminI18n() {
  return useContext(AdminI18nContext);
}
