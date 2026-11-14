"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import enTranslations from "@/locales/en.json";
import arTranslations from "@/locales/ar.json";

export type Language = "en" | "ar";
export type Direction = "ltr" | "rtl";

interface LanguageContextType {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

type TranslationValue = string | { [key: string]: TranslationValue };

const translations: Record<Language, TranslationValue> = {
  en: enTranslations,
  ar: arTranslations,
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "preferred_lang";

/**
 * The saved language lives in localStorage, which is an external store: read it
 * through useSyncExternalStore so the first client paint stays identical to the
 * server HTML and the switch to the stored language happens in one update
 * instead of a cascading setState inside an effect.
 */
let cachedLanguage: Language | null = null;
const listeners = new Set<() => void>();

function readStoredLanguage(): Language {
  if (cachedLanguage) return cachedLanguage;

  try {
    cachedLanguage = window.localStorage.getItem(STORAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    cachedLanguage = "en";
  }

  return cachedLanguage;
}

function subscribeToLanguage(onChange: () => void) {
  const onStorage = () => {
    cachedLanguage = null;
    onChange();
  };

  listeners.add(onStorage);
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onStorage);
    window.removeEventListener("storage", onStorage);
  };
}

function writeLanguage(lang: Language) {
  cachedLanguage = lang;

  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Private mode / blocked storage: the in-memory value still applies.
  }

  listeners.forEach((notify) => notify());
}

const SERVER_LANGUAGE: Language = "en";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const language = useSyncExternalStore(
    subscribeToLanguage,
    readStoredLanguage,
    () => SERVER_LANGUAGE
  );
  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  // Mirror the language onto <html> so screen readers and CSS :dir() agree.
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  const setLanguage = useCallback((lang: Language) => writeLanguage(lang), []);

  const toggleLanguage = useCallback(() => {
    writeLanguage(readStoredLanguage() === "en" ? "ar" : "en");
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      let current: TranslationValue | undefined = translations[language];

      for (const part of key.split(".")) {
        if (typeof current !== "object" || current === null || !(part in current)) {
          return fallback || key;
        }
        current = current[part];
      }

      return typeof current === "string" ? current : fallback || key;
    },
    [language]
  );

  const value = useMemo(
    () => ({ language, direction, setLanguage, toggleLanguage, t }),
    [language, direction, setLanguage, toggleLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
