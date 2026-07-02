"use client";

import { useEffect, type ReactNode } from "react";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import {
  expandTextsForTranslation,
  getTranslatedDisplay,
} from "@/lib/translate-text";
import {
  hasChecklistFormatting,
  parseBoldSegments,
  parseChecklistLines,
} from "@/lib/checklist-format";
import styles from "./FormattedChecklistText.module.css";

interface Props {
  text: string;
  done?: boolean;
}

export default function FormattedChecklistText({ text, done }: Props) {
  const { locale, td, translateTexts, translating } = useLocale();

  useEffect(() => {
    if (!text?.trim() || locale === "pt") return;
    void translateTexts(expandTextsForTranslation([text]), true);
  }, [text, locale, translateTexts]);

  const displayText = getTranslatedDisplay(text, locale, td);
  const lines = parseChecklistLines(displayText);
  const isPlain = !hasChecklistFormatting(displayText);

  const renderLine = (line: (typeof lines)[number], index: number): ReactNode => {
    if (line.kind === "blank") {
      return <div key={index} className={styles.blank} aria-hidden />;
    }

    const content = parseBoldSegments(line.content, `line-${index}`);

    if (line.kind === "h2") {
      return (
        <div key={index} className={`${styles.h2} ${done ? styles.done : ""}`}>
          {content}
        </div>
      );
    }

    if (line.kind === "h1") {
      return (
        <div key={index} className={`${styles.h1} ${done ? styles.done : ""}`}>
          {content}
        </div>
      );
    }

    if (line.kind === "h3") {
      return (
        <div key={index} className={`${styles.h3} ${done ? styles.done : ""}`}>
          {content}
        </div>
      );
    }

    return (
      <div key={index} className={`${styles.p} ${done ? styles.done : ""}`}>
        {content}
      </div>
    );
  };

  return (
    <div className={`${styles.wrap} ${isPlain ? styles.wrapPlain : ""}`}>
      {lines.map(renderLine)}
      {locale === "ru" && translating && displayText === text && text.trim() && (
        <span className={styles.translatingHint}>…</span>
      )}
    </div>
  );
}
