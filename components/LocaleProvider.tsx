"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  localeDir,
  translate,
  type Locale,
  type MessageKey,
} from "@/lib/i18n";

const STORAGE_KEY = "las-store-locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
  dir: "rtl" | "ltr";
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === "ar" || saved === "en") {
      setLocaleState(saved);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = localeDir(locale);
    localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, ready]);

  function setLocale(next: Locale) {
    setLocaleState(next);
  }

  const value: LocaleContextValue = {
    locale,
    setLocale,
    t: (key) => translate(locale, key),
    dir: localeDir(locale),
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
