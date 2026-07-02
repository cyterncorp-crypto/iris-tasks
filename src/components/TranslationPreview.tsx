"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  expandTextsForTranslation,
  getTranslatedDisplay,
} from "@/lib/translate-text";

interface Props {
  text: string;
  className?: string;
  as?: "span" | "p" | "div";
}

export default function TranslationPreview({
  text,
  className,
  as: Tag = "div",
}: Props) {
  const { locale, td, translateTexts, translating } = useLocale();
  const trimmed = text.trim();

  useEffect(() => {
    if (!trimmed || locale === "pt") return;
    void translateTexts(expandTextsForTranslation([trimmed]), true);
  }, [trimmed, locale, translateTexts]);

  if (locale === "pt" || !trimmed) return null;

  const translated = getTranslatedDisplay(trimmed, locale, td).trim();
  if (translated === trimmed && !translating) return null;

  return (
    <Tag className={className}>
      {translated === trimmed ? "..." : translated}
    </Tag>
  );
}
