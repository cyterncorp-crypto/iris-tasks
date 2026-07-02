"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { interpolate, messages, type Locale, type MessageKey } from "./messages";

const STORAGE_KEY = "sayyo-locale";
const dynamicCache = new Map<string, string>();
const FLUSH_DELAY_MS = 80;

type PendingRequest = {
  texts: string[];
  resolve: (result: string[]) => void;
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  td: (text: string) => string;
  translateTexts: (texts: string[], force?: boolean) => Promise<string[]>;
  subscribeLocalePrefetch: (fn: () => void) => () => void;
  translating: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

async function fetchTranslationsFromApi(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];

  const sorted = [...new Set(texts.filter((t) => t.trim()))].sort(
    (a, b) => b.length - a.length
  );

  const translateBatch = async (batch: string[]) => {
    if (batch.length === 0) return;
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: batch, target: "ru" }),
      });

      if (res.ok) {
        const data = (await res.json()) as { translations?: string[] };
        batch.forEach((text, index) => {
          const translated = data.translations?.[index] ?? text;
          const key = text.trim();
          dynamicCache.set(`ru|${key}`, translated);
          if (key !== text) dynamicCache.set(`ru|${text}`, translated);
        });
        setDynamicVersionGlobal();
      }
    } catch {
      // keep originals for this chunk
    }
  };

  const CHUNK_SIZE = 8;

  for (let pass = 0; pass < 3; pass++) {
    const uncached = sorted.filter((text) => {
      const key = text.trim();
      const cached = dynamicCache.get(`ru|${key}`);
      return !cached || cached === key;
    });

    if (uncached.length === 0) break;

    for (let i = 0; i < uncached.length; i += CHUNK_SIZE) {
      await translateBatch(uncached.slice(i, i + CHUNK_SIZE));
    }

    if (pass < 2) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return texts.map((text) => dynamicCache.get(`ru|${text}`) ?? text);
}

let versionListeners = new Set<() => void>();

function setDynamicVersionGlobal() {
  versionListeners.forEach((fn) => fn());
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("pt");
  const [dynamicVersion, setDynamicVersion] = useState(0);
  const [translating, setTranslating] = useState(false);

  const localeRef = useRef<Locale>("pt");
  const queueRef = useRef(new Set<string>());
  const pendingRef = useRef<PendingRequest[]>([]);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushingRef = useRef(false);
  const prefetchListenersRef = useRef(new Set<() => void>());

  useEffect(() => {
    const bump = () => setDynamicVersion((v) => v + 1);
    versionListeners.add(bump);
    return () => {
      versionListeners.delete(bump);
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "pt" || stored === "ru") {
      localeRef.current = stored;
      setLocaleState(stored);
    }
  }, []);

  const subscribeLocalePrefetch = useCallback((fn: () => void) => {
    prefetchListenersRef.current.add(fn);
    return () => {
      prefetchListenersRef.current.delete(fn);
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    localeRef.current = next;
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === "ru" ? "ru" : "pt-BR";
    setDynamicVersion((v) => v + 1);

    if (next === "ru") {
      prefetchListenersRef.current.forEach((fn) => fn());
    }
  }, []);

  useEffect(() => {
    localeRef.current = locale;
    document.documentElement.lang = locale === "ru" ? "ru" : "pt-BR";
  }, [locale]);

  const flushQueue = useCallback(async () => {
    if (flushingRef.current) return;
    flushingRef.current = true;
    setTranslating(true);

    try {
      while (queueRef.current.size > 0 || pendingRef.current.length > 0) {
        const batch = [...queueRef.current].sort((a, b) => b.length - a.length);
        queueRef.current.clear();

        if (batch.length > 0) {
          await fetchTranslationsFromApi(batch);
          setDynamicVersion((v) => v + 1);
        }

        const pending = pendingRef.current.splice(0);
        for (const { texts, resolve } of pending) {
          resolve(
            texts.map((text) => {
              const trimmed = text.trim();
              return (
                dynamicCache.get(`ru|${trimmed}`) ??
                dynamicCache.get(`ru|${text}`) ??
                text
              );
            })
          );
        }
      }
    } finally {
      flushingRef.current = false;
      setTranslating(false);
    }
  }, []);

  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null;
      void flushQueue();
    }, FLUSH_DELAY_MS);
  }, [flushQueue]);

  const translateTexts = useCallback(
    (texts: string[], force = false) => {
      const cleaned = texts.filter((t) => typeof t === "string" && t.trim());
      if (cleaned.length === 0) return Promise.resolve(texts);
      if (!force && localeRef.current === "pt") return Promise.resolve(texts);

      for (const text of cleaned) {
        queueRef.current.add(text);
      }

      return new Promise<string[]>((resolve) => {
        pendingRef.current.push({ texts, resolve });
        scheduleFlush();
      });
    },
    [scheduleFlush]
  );

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>): string => {
      const template = messages[locale][key] ?? messages.pt[key] ?? key;
      const text = typeof template === "string" ? template : String(key);
      return vars ? interpolate(text, vars) : text;
    },
    [locale]
  );

  const td = useCallback(
    (text: string) => {
      if (!text?.trim() || locale === "pt") return text;
      void dynamicVersion;
      const trimmed = text.trim();
      return (
        dynamicCache.get(`ru|${trimmed}`) ??
        dynamicCache.get(`ru|${text}`) ??
        text
      );
    },
    [locale, dynamicVersion]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      td,
      translateTexts,
      subscribeLocalePrefetch,
      translating,
    }),
    [locale, setLocale, t, td, translateTexts, subscribeLocalePrefetch, translating]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  const { t, td, locale, translateTexts, translating, subscribeLocalePrefetch } =
    useLocale();
  return { t, td, locale, translateTexts, translating, subscribeLocalePrefetch };
}
