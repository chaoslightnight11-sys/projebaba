"use client";

import { useRouter } from "next/navigation";
import { localeCookieName, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const languages: Array<{ locale: Locale; label: string }> = [
  { locale: "tr", label: "TR" },
  { locale: "en", label: "EN" }
];

export function LanguageToggle({
  locale,
  label = "Dil",
  variant = "compact",
  className
}: {
  locale: Locale;
  label?: string;
  variant?: "compact" | "prominent";
  className?: string;
}) {
  const router = useRouter();

  function setLocale(nextLocale: Locale) {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border bg-card p-1 shadow-sm",
        variant === "prominent" ? "h-12 gap-2 px-2" : "h-10",
        className
      )}
      aria-label={label}
    >
      {variant === "prominent" ? <span className="px-2 text-sm font-medium text-muted-foreground">{label}</span> : null}
      <div className="inline-flex items-center gap-1">
        {languages.map((language) => (
          <button
            key={language.locale}
            type="button"
            onClick={() => setLocale(language.locale)}
            className={cn(
              "rounded font-semibold transition",
              variant === "prominent" ? "h-9 min-w-12 px-3 text-sm" : "h-8 min-w-9 px-2 text-xs",
              locale === language.locale ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            aria-pressed={locale === language.locale}
          >
            {language.label}
          </button>
        ))}
      </div>
    </div>
  );
}
