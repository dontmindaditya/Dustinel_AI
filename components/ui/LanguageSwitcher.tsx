"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Globe, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: "en", label: "English", flag: "🇺🇸" },
    { code: "hi", label: "हिन्दी (Hindi)", flag: "🇮🇳" },
    { code: "bn", label: "বাংলা (Bengali)", flag: "🇧🇸" },
    { code: "te", label: "తెలుగు (Telugu)", flag: "🇾🇳" },
    { code: "mr", label: "मराठी (Marathi)", flag: "🇮🇳" },
    { code: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  ];

  const handleLanguageChange = (code: string) => {
    setIsOpen(false);

    if (code === locale) return;

    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; samesite=lax`;
    router.replace(pathname);
    router.refresh();
  };

  return (
    <div className={className}>
      <Select 
        onOpenChange={setIsOpen}
        value={locale}
        onValueChange={(value: string) => handleLanguageChange(value)}
      >
        <SelectTrigger className="flex items-center gap-1.5 p-2 rounded-md border border-border bg-background hover:bg-secondary/50 transition-colors">
          <Globe className="h-4 w-4" />
          <SelectValue className="text-sm font-medium" placeholder={t("language")} />
          <ChevronDown className="h-4 w-4" />
        </SelectTrigger>
        <SelectContent className="w-48 z-50">
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="flex items-center justify-between gap-2 p-2 hover:bg-secondary/50"
            >
              <span className="flex items-center gap-2">
                {lang.flag}
                {lang.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
