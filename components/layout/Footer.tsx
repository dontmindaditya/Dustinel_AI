"use client";

import { useWorkerI18n } from "@/lib/workerI18n";

export function Footer() {
  const { t } = useWorkerI18n();

  return (
    <footer className="border-t border-border py-4 mt-auto">
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground text-center sm:text-left">
        <p className="leading-relaxed">{t("footer.tagline")}</p>
      </div>
    </footer>
  );
}
