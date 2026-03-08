"use client";

import { Check, Languages } from "lucide-react";
import { cn } from "@/lib/utils";

export type LanguageOption = {
  value: string;
  label: string;
  nativeLabel: string;
  region: string;
};

interface LanguagePreferenceCardProps {
  title: string;
  description: string;
  selectedValue: string;
  options: LanguageOption[];
  onSelect: (value: string) => void;
}

export function LanguagePreferenceCard({
  title,
  description,
  selectedValue,
  options,
  onSelect,
}: LanguagePreferenceCardProps) {
  const selected = options.find((option) => option.value === selectedValue) ?? options[0];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-background/80 text-primary">
            <Languages className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold tracking-tight">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Current language
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-lg font-semibold">{selected.label}</p>
            <p className="text-sm text-muted-foreground">{selected.nativeLabel}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {options.map((option) => {
            const active = option.value === selectedValue;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/15"
                    : "border-border bg-background hover:border-primary/35 hover:bg-muted/40"
                )}
              >
                <div className="absolute right-3 top-3">
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                      active
                        ? "border-primary-foreground/40 bg-primary-foreground/15"
                        : "border-border bg-background text-transparent group-hover:text-muted-foreground"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </div>
                </div>

                <p
                  className={cn(
                    "pr-8 text-sm font-semibold tracking-tight",
                    active ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  {option.label}
                </p>
                <p
                  className={cn(
                    "mt-1 text-sm",
                    active ? "text-primary-foreground/80" : "text-muted-foreground"
                  )}
                >
                  {option.nativeLabel}
                </p>
                <p
                  className={cn(
                    "mt-3 text-[11px] font-medium uppercase tracking-[0.16em]",
                    active ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {option.region}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
