"use client";

import { useEffect } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { expandTextsForTranslation, getTranslatedDisplay } from "@/lib/translate-text";

interface Props {
  text: string;
  className?: string;
  as?: "span" | "p" | "div";
}

export default function TranslatedText({
  text,
  className,
  as: Tag = "span",
}: Props) {
  const { locale, td, translateTexts } = useLocale();

  useEffect(() => {
    if (!text?.trim() || locale === "pt") return;
    void translateTexts(expandTextsForTranslation([text]), true);
  }, [text, locale, translateTexts]);

  const display = getTranslatedDisplay(text, locale, td);

  return <Tag className={className}>{display}</Tag>;
}
